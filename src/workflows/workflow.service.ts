import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { WorkflowRepository } from './workflows.repository';
import Summarizer_Output from './nodes/outputs/summarizer';
import {
  FlowData,
  flowConfigSchema,
  flowDataSchema,
} from '@avp1598/spect-shared-types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async getAllWorkflowsByCircle(circle: string) {
    return await this.workflowRepository.findAll({
      circle,
    });
  }

  async getWorkflow(id: string) {
    return await this.workflowRepository.findById(id);
  }

  async createWorkflow(body: { name: string; circle: string }) {
    return await this.workflowRepository.create(body);
  }

  async updateWorkflow(id: string, flowConfig: string) {
    return await this.workflowRepository.updateById(id, {
      flowConfig,
    });
  }

  async runWorkflow(flowId: string) {
    let flow = await this.getWorkflow(flowId);
    const flowConfig = flowConfigSchema.parse(JSON.parse(flow.flowConfig));
    let res = '';
    const summarizerNodes = flowConfig.nodes.filter(
      (node) => node.type === 'summarizer',
    );
    const updates: FlowData[string][] = [];
    if (flow.runs.length > 40) {
      throw new InternalServerErrorException(
        'During beta you can only run a flow 5 times',
      );
    }

    // add run to flow
    const runId = uuid();
    flow = await this.workflowRepository.updateById(flowId, {
      runs: [
        ...(flow.runs || []),
        {
          runId,
          startTime: new Date().toISOString(),
        },
      ],
    });
    const outputs = {};
    for await (const node of summarizerNodes) {
      const summarizerNode = new Summarizer_Output(
        {
          name: flow.name,
          id: flow.id,
          circle: flow.circle,
          flowConfig,
          flowData: flowDataSchema.parse(JSON.parse(flow.flowData || '{}')),
          runs: flow.runs,
        },
        node,
        this.commandBus,
        this.queryBus,
        flowDataSchema.parse(JSON.parse(flow.flowData || '{}')),
        async ({ nodeId, data, status, error, cacheKey }) => {
          updates.push({
            nodeId,
            data,
            status,
            error,
            cacheKey,
          });
        },
      );
      const summarizerNodeRes = await summarizerNode.run();
      const totalUpdate: FlowData = updates.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.nodeId]: curr,
        }),
        {},
      );
      await this.workflowRepository.updateById(flowId, {
        flowData: JSON.stringify({
          ...flowDataSchema.parse(JSON.parse(flow.flowData || '{}')),
          ...totalUpdate,
        }),
      });
      outputs[node.id] = summarizerNodeRes;
      res += summarizerNodeRes;
    }

    // update run
    console.log({ runs: flow.runs });
    await this.workflowRepository.updateById(flowId, {
      runs: flow.runs?.map((run) =>
        run.runId === runId
          ? {
              ...run,
              endTime: new Date().toISOString(),
              status: res ? 'success' : 'failed',
              outputs,
            }
          : run,
      ),
    });

    return res;
  }
}

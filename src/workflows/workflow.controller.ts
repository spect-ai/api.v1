import { Controller, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import {
  workflowContract,
  flowConfigSchema,
  flowDataSchema,
} from '@avp1598/spect-shared-types';
import { z } from 'zod';
import { AIWhitelistAuthGuard } from 'src/auth/iron-session.guard';

@Controller('/')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @TsRestHandler(workflowContract.getAllFlowsByCircle)
  getAllFlowsByCircle() {
    return tsRestHandler(
      workflowContract.getAllFlowsByCircle,
      async ({ query: { circle } }) => {
        const workflows = await this.workflowService.getAllWorkflowsByCircle(
          circle,
        );
        return {
          status: 200,
          body: workflows.map((workflow) => {
            if (!workflow.flowConfig)
              return {
                id: workflow.id,
                name: workflow.name,
                circle: workflow.circle,
                flowConfig: {
                  nodes: [],
                  edges: [],
                },
                flowData: {},
                runs: [],
              };
            const flowConfig = flowConfigSchema.parse(
              JSON.parse(workflow.flowConfig),
            );
            const flowData = flowDataSchema.parse(
              JSON.parse(workflow.flowData || '{}'),
            );
            return {
              id: workflow.id,
              name: workflow.name,
              circle: workflow.circle,
              flowConfig,
              flowData,
              runs: workflow.runs,
            };
          }),
        };
      },
    );
  }

  @TsRestHandler(workflowContract.getFlow)
  getFlow() {
    return tsRestHandler(
      workflowContract.getFlow,
      async ({ params: { id } }) => {
        const workflow = await this.workflowService.getWorkflow(id);
        const flowConfig = flowConfigSchema.parse(
          JSON.parse(workflow.flowConfig),
        );
        const flowData = flowDataSchema.parse(
          JSON.parse(workflow.flowData || '{}'),
        );
        return {
          status: 200,
          body: {
            id: workflow.id,
            name: workflow.name,
            circle: workflow.circle,
            flowConfig,
            flowData,
            runs: workflow.runs,
          },
        };
      },
    );
  }

  @TsRestHandler(workflowContract.createFlow)
  createFlow() {
    return tsRestHandler(
      workflowContract.createFlow,
      async ({ body: { name, circle } }) => {
        const workflow = await this.workflowService.createWorkflow({
          name,
          circle,
        });
        return {
          status: 201,
          body: {
            id: workflow.id,
            name: workflow.name,
            circle: workflow.circle,
            flowConfig: {
              nodes: [],
              edges: [],
            },
            flowData: {},
            runs: [],
          },
        };
      },
    );
  }

  @TsRestHandler(workflowContract.updateFlow)
  updateFlow() {
    return tsRestHandler(
      workflowContract.updateFlow,
      async ({ params: { id }, body: { flowConfig } }) => {
        const workflow = await this.workflowService.updateWorkflow(
          id,
          JSON.stringify(flowConfig),
        );
        const flowData = flowDataSchema.parse(
          JSON.parse(workflow.flowData || '{}'),
        );
        return {
          status: 200,
          body: {
            name: workflow.name,
            circle: workflow.circle,
            id: workflow.id,
            flowConfig,
            flowData,
            runs: workflow.runs,
          },
        };
      },
    );
  }

  @UseGuards(AIWhitelistAuthGuard)
  @TsRestHandler(workflowContract.runFlow)
  runFlow() {
    return tsRestHandler(
      workflowContract.runFlow,
      async ({ params: { id } }) => {
        const res = await this.workflowService.runWorkflow(id);
        return {
          status: 200,
          body: {
            formSlug: z.string().parse(res) as any,
          },
        };
      },
    );
  }
}

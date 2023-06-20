import { Flow, FlowData, FlowNode, INode } from '@avp1598/spect-shared-types';

const host = 'https://hub.snapshot.org/graphql';

class Snapshot_Source implements INode {
  flow: Flow;
  flowData: FlowData;
  node: FlowNode;
  updateFlowData: ({
    nodeId,
    status,
    error,
    data,
    cacheKey,
  }: FlowData[string]) => void;

  constructor(
    flow: Flow,
    node: FlowNode,
    flowData: FlowData,
    updateFlowData: ({
      nodeId,
      status,
      error,
      data,
      cacheKey,
    }: FlowData[string]) => void,
  ) {
    this.flow = flow;
    this.node = node;
    this.flowData = flowData;
    this.updateFlowData = updateFlowData;
  }

  async run(): Promise<string> {
    let res = '';
    if (this.node.type === 'snapshot') {
      try {
        const space = this.node.data.url.split('/').pop();
        console.log({ space });
        if (!space) throw new Error('Invalid  Snapshot space');
        const proposalsQuery = `
            query {
                proposals (
                first: 10,
                skip: 0,
                where: {
                    space_in: ["${space}"],
                    state: "active"
                },
                orderBy: "created",
                orderDirection: desc
                ) {
                body
                }
            }`;
        const snapshotRes = await fetch(host, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: proposalsQuery }),
        });
        const json = await snapshotRes.json();
        if (json.data?.proposals) {
          console.log({ proposals: json.data.proposals });
          res = json.data.proposals.map((p: any) => p.body).join('\n\n');
        }
        console.log({ res });
        this.updateFlowData({
          nodeId: this.node.id,
          status: 'success',
          data: res,
          cacheKey: '',
        });
        console.log('Snapshot finished');
      } catch (e) {
        console.log(e);
        this.updateFlowData({
          nodeId: this.node.id,
          status: 'error',
          data: '',
          error: e.message,
        });
        res = '';
        throw e;
      }
    }

    return res;
  }
}

export default Snapshot_Source;

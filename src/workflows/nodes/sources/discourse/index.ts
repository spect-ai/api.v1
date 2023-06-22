import { Flow, FlowData, FlowNode, INode } from '@avp1598/spect-shared-types';

class Discourse_Source implements INode {
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
    if (this.node.type === 'discourse') {
      try {
        const rootUrl = this.node.data.url.split('/').slice(0, 3).join('/');
        console.log({ rootUrl });
        const category = this.node.data.url.split('/')[5];
        console.log({ category });
        if (isNaN(Number(category)))
          throw new Error('Invalid category id, must be a number');

        const top = await fetch(
          `${rootUrl}/c/${category}/l/top.json?order=created&ascending=false&period=weekly`,
        ).then((res) => res.json());

        const topicContent = [];

        for (const topic of top.topic_list.topics) {
          const topicUrl = `${rootUrl}/raw/${topic.id}/1`;
          const md = await fetch(topicUrl).then((res) => res.text());
          console.log({ md });
          topicContent.push(md);
        }

        res = topicContent.join('\n\n');

        this.updateFlowData({
          nodeId: this.node.id,
          status: 'success',
          data: res,
          cacheKey: '',
        });
        console.log('Discourse finished');
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

export default Discourse_Source;

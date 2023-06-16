import * as cheerio from 'cheerio';
import { Flow, FlowData, FlowNode, INode } from '@avp1598/spect-shared-types';

class Mirror_Source implements INode {
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
    if (this.node.type === 'mirror') {
      // if (this.flowData[this.node.id] && this.flowData[this.node.id].data) {
      //   res = this.flowData[this.node.id].data;
      // } else {
      try {
        const rootHtml = await fetch(this.node.data.url).then((res) =>
          res.text(),
        );

        let $ = cheerio.load(rootHtml);
        // find all hrefs
        const hrefs: string[] = [];
        $('html')
          .find('a')
          .map((i, el) => {
            const href = $(el).attr('href');
            if (href && $(el).siblings().length > 1) hrefs.push(href);
          });

        const latestPost = hrefs[0];

        if (!latestPost) throw new Error('No mirror blog post found');

        if (this.flowData[this.node.id]?.cacheKey === latestPost) {
          res = this.flowData[this.node.id].data;
          return res;
        }

        const postHtml = await fetch(latestPost).then((res) => res.text());
        let postText = '';
        $ = cheerio.load(postHtml);
        $('html')
          .find('h1, h2, h3, h4, h5, h6, p')
          .map((i, el) => {
            const text = $(el).text();
            if (text) postText += text + '\n';
          });
        res = postText;
        this.updateFlowData({
          nodeId: this.node.id,
          status: 'success',
          data: res,
          cacheKey: latestPost,
        });
        console.log('Mirror finished');
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
      // }
    }

    return res;
  }
}

export default Mirror_Source;

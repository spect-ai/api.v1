import * as cheerio from 'cheerio';
import { Flow, FlowData, FlowNode, INode } from '@avp1598/spect-shared-types';

class Reddit_Source implements INode {
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
    if (this.node.type === 'reddit') {
      try {
        const rootHtml = await fetch(
          `${this.node.data.url}?f=flair_name:%22${this.node.data.filter}%22&sort=new`,
        ).then((res) => res.text());
        // console.log({ rootHtml });
        let $ = cheerio.load(rootHtml);
        // find all hrefs
        const hrefs: string[] = [];
        $('html')
          .find('a')
          .map((i, el) => {
            const href = $(el).attr('href');
            if (href?.includes('comments')) {
              hrefs.push(href);
            }
          });

        if (!hrefs[0]) throw new Error('No reddit post found');

        const latestPost = 'https://www.reddit.com' + hrefs[0];

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
        console.log('Reddit finished');
      } catch (e) {
        console.log({ e });
        this.updateFlowData({
          nodeId: this.node.id,
          status: 'error',
          data: '',
          error: e.message,
        });
        throw e;
      }
    }

    return res;
  }
}

export default Reddit_Source;

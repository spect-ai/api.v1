import { getVideoMP3Binary } from 'yt-get';
import { Deepgram } from '@deepgram/sdk';
import { Flow, FlowData, FlowNode, INode } from '@avp1598/spect-shared-types';

class Youtube_Source implements INode {
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
    if (this.node.type === 'youtube') {
      try {
        const channelId = this.node.data.channelId;
        const query = this.node.data.filter.replace(' ', '%20');

        const videos = await (
          await fetch(
            `https://youtube.googleapis.com/youtube/v3/search?channelId=${channelId}&order=date&q=${query}&key=${process.env.YOUTUBE_API_KEY}`,
          )
        ).json();
        if (!videos.items?.length)
          throw new Error(
            'No youtube video found for the given filter, check the filter or channel id',
          );
        const latestVideoId = videos.items[0].id.videoId;
        if (!latestVideoId) throw new Error('No youtube video found');

        if (this.flowData[this.node.id]?.cacheKey === latestVideoId) {
          res = this.flowData[this.node.id].data;
          return res;
        }
        const videoUrl = `https://www.youtube.com/watch?v=${latestVideoId}`;
        const { mp3 } = await getVideoMP3Binary(videoUrl);
        // if (mp3.byteLength > 36468772)
        //   throw new Error(
        //     'Youtube video too large, video needs to be less than or around 30 mins',
        //   );
        const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY || '');
        const response = await deepgram.transcription.preRecorded(
          {
            buffer: mp3,
            mimetype: 'audio/mpeg',
          },
          {
            punctuate: true,
            utterances: true,
            model: 'whisper',
          },
        );
        if ('results' in response) {
          let transcription = '';
          response.results?.utterances?.forEach((utterance) => {
            transcription += utterance.transcript + '\n';
          });
          res = transcription;
          this.updateFlowData({
            nodeId: this.node.id,
            status: 'success',
            data: res,
            cacheKey: latestVideoId,
          });
          console.log('youtube finished');
        }
      } catch (e) {
        console.log(e);
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

export default Youtube_Source;

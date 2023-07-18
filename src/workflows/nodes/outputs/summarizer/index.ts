import { OpenAI } from 'langchain/llms/openai';
import Mirror_Source from '../../sources/mirror';
import Youtube_Source from '../../sources/youtube';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import {
  LLMChain,
  MapReduceDocumentsChain,
  StuffDocumentsChain,
} from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import Reddit_Source from '../../sources/reddit';
import { v4 as uuid } from 'uuid';
import { Flow, FlowData, FlowNode, INode } from '@avp1598/spect-shared-types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  AddPropertyCommand,
  CreateCollectionCommand,
} from 'src/collection/commands';
import { Collection } from 'src/collection/model/collection.model';
import { GetProfileQuery } from 'src/users/queries/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Circle } from 'src/circle/model/circle.model';
import { UpdateFolderCommand } from 'src/circle/commands/impl';
import { Converter } from 'showdown';
import Discourse_Source from '../../sources/discourse';
import Snapshot_Source from '../../sources/snapshot';

const nodeTypeToSourceClassMap: Record<string, any> = {
  mirror: Mirror_Source,
  reddit: Reddit_Source,
  youtube: Youtube_Source,
  discourse: Discourse_Source,
  snapshot: Snapshot_Source,
};

class Summarizer_Output implements INode {
  flow: Flow;
  node: FlowNode;
  commandBus: CommandBus;
  queryBus: QueryBus;
  flowData: FlowData;
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
    commandBus: CommandBus,
    queryBus: QueryBus,
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
    this.commandBus = commandBus;
    this.queryBus = queryBus;
    this.flowData = flowData;
    this.updateFlowData = updateFlowData;
  }

  async run(): Promise<string> {
    if (this.node.type === 'summarizer') {
      try {
        const inputNodes = this.flow.flowConfig.edges
          .filter((edge) => edge.source === this.node.id)
          .map((edge) => edge.target);

        const promises: Promise<string>[] = [];

        for (const input of inputNodes) {
          const inputNode = this.flow.flowConfig.nodes.find(
            (node) => node.id === input,
          );
          const sourceClass = nodeTypeToSourceClassMap[inputNode?.type];

          if (sourceClass) {
            const sourceNode = new sourceClass(
              this.flow,
              inputNode,
              this.flowData,
              this.updateFlowData,
            );
            promises.push(sourceNode.run());
          }
        }

        const inputText = (await Promise.all(promises)).join('\n');

        console.log({ inputText: inputText.length });

        const { chunkSize, chunkOverlap } = this.getChunkSize(inputText.length);

        // const chunkSize = 2000;
        // const chunkOverlap = 500;

        console.log({ chunkSize, chunkOverlap });

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize,
          chunkOverlap,
        });
        const chunks = await splitter.createDocuments([inputText]);
        console.log({ chunks: chunks.length });

        const combinePromptTemplate = `
        I would like to create multiple choice questions for my students based on the following text. I also need a short engaging summary of the text which makes people click on it. Can you help me generate 4 such questions. Here is my desired format for each multiple choice question:

        [SUMMARY]

        1. [QUESTION]
        A: [OPTION 1]
        B: [OPTION 2]
        C: [OPTION 3]


        Text: {text}

        `;

        const combineMapTemplate = `
        Write a summary of the following in about 200 words or less. Make it very engaging and fun using emojis. Don't use phrases like "in this post", "in this article" etc. You can divide it into paragraphs or bullet points. Give the output in markdown.

        Text: {text}
        `;

        if (chunks.length > 9) {
          throw new Error(
            'Too much content, reduce the sources or choose sources with lesser content.',
          );
        }

        const llm = new OpenAI({ temperature: 0 });
        const llmChain = new LLMChain({
          prompt: new PromptTemplate({
            template: combineMapTemplate,
            inputVariables: ['text'],
          }),
          llm,
        });
        const combineLLMChain = new LLMChain({
          prompt: new PromptTemplate({
            template: combinePromptTemplate,
            inputVariables: ['text'],
          }),
          llm,
        });
        const combineDocumentChain = new StuffDocumentsChain({
          llmChain: combineLLMChain,
          documentVariableName: 'text',
          verbose: true,
        });
        const chain = new MapReduceDocumentsChain({
          llmChain,
          combineDocumentChain,
          documentVariableName: 'text',
          ensureMapStep: true,
          verbose: true,
          returnIntermediateSteps: true,
        });

        const res = await chain.call({
          input_documents: chunks,
        });
        this.updateFlowData({
          nodeId: this.node.id,
          status: 'success',
          data: JSON.stringify(res),
        });
        return await this.createForm(res);
      } catch (e) {
        console.log({ e });
        this.updateFlowData({
          nodeId: this.node.id,
          status: 'error',
          data: '',
          error: e.message,
        });
        return '';
      }
    } else {
      return '';
    }
  }

  async createForm(data: any = {}): Promise<string> {
    if (this.node.type === 'summarizer') {
      const converter = new Converter();
      // parse questions
      const output: {
        text: string;
        intermediateSteps: string[];
      } = data;
      const rawQuestions = output.text.split('\n');
      console.log({ rawQuestions, text: output.text });
      const questions = rawQuestions
        .slice(rawQuestions.findIndex((line) => line.startsWith('1.')))
        .filter((line) => line);
      const botUser = await this.queryBus.execute(
        new GetProfileQuery(
          {
            username: 'Stu, the Spect Bot',
          },
          '',
        ),
      );
      const form: Collection = await this.commandBus.execute(
        new CreateCollectionCommand(
          {
            name: this.node.data.formName,
            description: converter.makeHtml(rawQuestions[1].trim().slice(10)),
            collectionType: 0,
            circleId: this.flow.circle,
          },
          botUser.id,
        ),
      );

      let lineCount = 1;
      for await (const line of output.intermediateSteps) {
        const html = converter.makeHtml(line);
        await this.commandBus.execute(
          new AddPropertyCommand(
            {
              name: `${lineCount}.`,
              id: uuid(),
              type: 'readonly',
              description: html,
            },
            botUser.id,
            form.id,
            form.formMetadata.pageOrder[1],
          ),
        );
        lineCount++;
      }

      await this.commandBus.execute(
        await new AddPropertyCommand(
          {
            name: `Quiz`,
            id: uuid(),
            type: 'readonly',
            description: `<p>Now time for some Questions!</p>`,
          },
          botUser.id,
          form.id,
          form.formMetadata.pageOrder[1],
        ),
      );

      for (let i = 0; i < questions.length; i += 4) {
        const question = questions[i];
        const options = questions.slice(i + 1, i + 4).map((option) => {
          return {
            label: option.slice(3),
            value: uuid(),
          };
        });
        await this.commandBus.execute(
          new AddPropertyCommand(
            {
              name: question,
              id: uuid(),
              type: 'singleSelect',
              options,
            },
            botUser.id,
            form.id,
            form.formMetadata.pageOrder[1],
          ),
        );
      }

      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(this.flow.circle),
      );
      const folderId = circle.folderOrder[0];
      console.log({ folderId });
      await this.commandBus.execute(
        new UpdateFolderCommand(this.flow.circle, circle.folderOrder[0], {
          contentIds: [
            ...circle.folderDetails[circle.folderOrder[0]].contentIds,
            form.id,
          ],
        }),
      );
      return form.slug;
    }
  }

  getChunkSize(inputTextLength: number) {
    if (inputTextLength < 4500) {
      return {
        chunkSize: 1200,
        chunkOverlap: 200,
      };
    } else if (inputTextLength >= 4500 && inputTextLength < 7500) {
      return {
        chunkSize: 1700,
        chunkOverlap: 300,
      };
    } else if (inputTextLength >= 7500 && inputTextLength < 10000) {
      return {
        chunkSize: 2000,
        chunkOverlap: 400,
      };
    } else if (inputTextLength >= 10000 && inputTextLength < 20000) {
      return {
        chunkSize: 4000,
        chunkOverlap: 500,
      };
    } else {
      return {
        chunkSize: 6000,
        chunkOverlap: 600,
      };
    }
  }
}

export default Summarizer_Output;

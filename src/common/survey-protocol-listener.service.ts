import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers, utils } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { GetCollectionByFilterQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RegistryService } from 'src/registry/registry.service';
import { surveyHubAbi } from './abis/surveyHub';

@Injectable()
export class SurveyProtocolListener {
  private iface = new utils.Interface(surveyHubAbi);
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly registryService: RegistryService,
    private readonly logger: LoggingService,
  ) {
    // Need to refactor update payment method before we can use this
    console.log('Survey Protocol Listener listening');
    this.logger.setContext('SurveyProtocolListener');
    if (process.env.ALCHEMY_API_KEY_POLYGON) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_POLYGON,
        Network.MATIC_MAINNET,
        '0xD38028814eC0AAD592c97dE015B6F7ee5c019B48',
      );
      alchemy.ws.on(filterResponse, (log) => {
        this.decodeTransactionAndRecord(log);
      });
    }
    if (process.env.ALCHEMY_API_KEY_MUMBAI) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_MUMBAI,
        Network.MATIC_MUMBAI,
        '0x5CaD4E6E58cBc16a934F013081c7111E68c4FC51',
      );
      alchemy.ws.on(filterResponse, (log) => {
        this.decodeTransactionAndRecord(log);
      });
    }
  }

  private getWS(key: string, network: Network, surveyHubAddress: string) {
    const settings = {
      apiKey: key,
      network: network,
    };
    const alchemy = new Alchemy(settings);
    // For some reason the filter is not working with mutliple topics
    const filterResponse = {
      address: surveyHubAddress,
      topics: [utils.id('ResponseAdded(uint256,address,uint256)')],
    };
    return { filterResponse, alchemy };
  }

  private async decodeTransactionAndRecord(log: any) {
    try {
      if (
        log.topics[0] === utils.id('ResponseAdded(uint256,address,uint256)')
      ) {
        const decodedEvents = this.iface.decodeEventLog(
          'ResponseAdded',
          log.data,
          log.topics,
        );

        const surveyId = decodedEvents[0].toNumber();
        const responseCount = decodedEvents[2].toNumber();
        await this.checkConditionAndTriggerRandomNumberGenerator(
          surveyId,
          responseCount,
        );
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  private async checkConditionAndTriggerRandomNumberGenerator(
    surveyId: number,
    responseCount: number,
  ) {
    try {
      const registry = await this.registryService.getRegistry();

      const provider = new ethers.providers.JsonRpcProvider(
        registry['80001'].provider,
      );
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      const surveyProtocol = new ethers.Contract(
        registry['80001'].surveyHubAddress,
        surveyHubAbi,
        signer,
      );
      const distribution = await surveyProtocol.distributionInfo(surveyId);
      if (
        distribution.distributionType !== 0 ||
        distribution.requestId?.toNumber() > 0
      ) {
        return;
      }
      const conditions = await surveyProtocol.conditionInfo(surveyId);
      // Response count is the token id which is 0 indexed
      if (responseCount + 1 < conditions.minTotalSupply) {
        return;
      }

      console.log('triggering random number generator');

      const tx = await surveyProtocol.triggerRandomNumberGenerator(surveyId);
      // console.log({ tx });
      // const distributionAfter = await surveyProtocol.distributionInfo(surveyId);
      // console.log({ distributionAfter });

      // const collection = await this.queryBus.execute(
      //   new GetCollectionByFilterQuery({
      //     'formMetadata.surveyTokenId': surveyId,
      //   }),
      // );

      // if (!collection) {
      //   throw `Collection not found with surveyId ${surveyId}`;
      // }
      // await this.commandBus.execute(
      //   new UpdateCollectionCommand(
      //     {
      //       formMetadata: {
      //         ...collection.formMetadata,
      //         surveyVRFRequestId: distributionAfter.requestId?.toString(),
      //       },
      //     },
      //     'bot',
      //     collection._id?.toString(),
      //   ),
      // );
    } catch (e) {
      this.logger.error(e);
    }
  }
}

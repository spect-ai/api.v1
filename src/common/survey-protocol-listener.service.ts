import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers, utils } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { GetCollectionByFilterQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { RegistryService } from 'src/registry/registry.service';
import { surveyHubAbi } from './abis/surveyHub';
import { GasPredictionService } from './gas-prediction.service';

@Injectable()
export class SurveyProtocolListener {
  private iface = new utils.Interface(surveyHubAbi);
  constructor(
    private readonly queryBus: QueryBus,
    private readonly gasPredictionService: GasPredictionService,
    private readonly registryService: RegistryService,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
  ) {
    // Need to refactor update payment method before we can use this
    console.log('Survey Protocol Listener listening');
    this.logger.setContext('SurveyProtocolListener');
    if (process.env.ALCHEMY_API_KEY_POLYGON) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_POLYGON,
        Network.MATIC_MAINNET,
        '0x9b51512FC5bFabC9A1855460e7fe57189E605499',
      );
      alchemy.ws.on(filterResponse, (log) => {
        this.decodeTransactionAndRecord(log, '137');
      });
    }
    if (process.env.ALCHEMY_API_KEY_MUMBAI) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_MUMBAI,
        Network.MATIC_MUMBAI,
        '0x5CaD4E6E58cBc16a934F013081c7111E68c4FC51',
      );
      alchemy.ws.on(filterResponse, (log) => {
        this.decodeTransactionAndRecord(log, '80001');
      });
    }
    if (process.env.ALCHEMY_API_KEY_GOERLI) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_GOERLI,
        Network.ETH_GOERLI,
        '0x3B3aa0D59857753aFA6C41bDCC6a8E22553c3d95',
      );
      alchemy.ws.on(filterResponse, (log) => {
        this.decodeTransactionAndRecord(log, '5');
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

  private async decodeTransactionAndRecord(log: any, chainId: string) {
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
        const responder = decodedEvents[1].toLowerCase();
        const responseCount = decodedEvents[2].toNumber();
        await this.checkConditionAndTriggerRandomNumberGenerator(
          surveyId,
          responseCount,
          chainId,
          responder,
        );
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  private async checkConditionAndTriggerRandomNumberGenerator(
    surveyId: number,
    responseCount: number,
    chainId: string,
    responder: string,
  ) {
    try {
      const registry = await this.registryService.getRegistry();

      const provider = new ethers.providers.JsonRpcProvider(
        registry[chainId].provider,
      );
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      const surveyProtocol = new ethers.Contract(
        registry[chainId].surveyHubAddress,
        surveyHubAbi,
        signer,
      );
      const distribution = await surveyProtocol.distributionInfo(surveyId);
      if (distribution.distributionType === 1) {
        const collection = await this.queryBus.execute(
          new GetCollectionByFilterQuery({
            'formMetadata.surveyTokenId': surveyId,
            'formMetadata.surveyChain.value': chainId.toString(),
          }),
        );
        if (collection) {
          this.realtime.server.emit(`${collection.slug}:responseAddedOnChain`, {
            userAddress: responder,
          });
        }
      } else if (
        distribution.distributionType === 0 &&
        distribution.requestId?.toNumber() === 0
      ) {
        const conditions = await surveyProtocol.conditionInfo(surveyId);
        // Response count is the token id which is 0 indexed
        if (responseCount + 1 < conditions.minTotalSupply) {
          return;
        }

        let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
        let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
        if (['137', '80001'].includes(chainId)) {
          const feeEstimate = await this.gasPredictionService.predictGas(
            chainId,
          );
          maxFeePerGas = ethers.utils.parseUnits(
            Math.ceil(feeEstimate.maxFee + 100) + '',
            'gwei',
          );
          maxPriorityFeePerGas = ethers.utils.parseUnits(
            Math.ceil(feeEstimate.maxPriorityFee + 25) + '',
            'gwei',
          );
        }
        console.log('triggering random number generator');

        const gasEstimate =
          await surveyProtocol.estimateGas.triggerRandomNumberGenerator(
            surveyId,
          );

        const tx = await surveyProtocol.triggerRandomNumberGenerator(surveyId, {
          gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2),
          maxFeePerGas,
          maxPriorityFeePerGas,
        });
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
}

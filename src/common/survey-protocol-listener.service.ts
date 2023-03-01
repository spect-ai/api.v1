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
import { GasPredictionService } from './gas-prediction.service';

@Injectable()
export class SurveyProtocolListener {
  private iface = new utils.Interface(surveyHubAbi);
  constructor(
    private readonly commandBus: CommandBus,
    private readonly gasPredictionService: GasPredictionService,
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
        const responseCount = decodedEvents[2].toNumber();
        await this.checkConditionAndTriggerRandomNumberGenerator(
          surveyId,
          responseCount,
          chainId,
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
      let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
      let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
      const feeEstimate = await this.gasPredictionService.predictGas(chainId);
      maxFeePerGas = ethers.utils.parseUnits(
        Math.ceil(feeEstimate.maxFee + 100) + '',
        'gwei',
      );
      maxPriorityFeePerGas = ethers.utils.parseUnits(
        Math.ceil(feeEstimate.maxPriorityFee + 25) + '',
        'gwei',
      );

      const gasEstimate =
        await surveyProtocol.estimateGas.triggerRandomNumberGenerator(surveyId);

      const tx = await surveyProtocol.triggerRandomNumberGenerator(surveyId, {
        gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2),
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
    } catch (e) {
      this.logger.error(e);
    }
  }
}

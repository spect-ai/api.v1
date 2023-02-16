import { Injectable } from '@nestjs/common';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers, utils } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { LoggingService } from 'src/logging/logging.service';
import { RegistryService } from 'src/registry/registry.service';
import { distributorAbi } from './abis/distributor';
import { surveyHubAbi } from './abis/surveyHub';

@Injectable()
export class SurveyProtocolListener {
  private iface = new utils.Interface(distributorAbi);
  private decoder = new AbiCoder();

  constructor(
    private readonly registryService: RegistryService,
    private readonly logger: LoggingService,
  ) {
    // Need to refactor update payment method before we can use this
    console.log('Listener listening');
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
        '0xaE54aD3a126c3C494B3aa9d82F3db6681BaE9a70',
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
      topics: [utils.id('responseAdded(uint256, address, uint256)')],
    };
    return { filterResponse, alchemy };
  }

  private async decodeTransactionAndRecord(log: any) {
    try {
      if (
        log.topics[0] === utils.id('responseAdded(uint256, address, uint256)')
      ) {
        const decodedEvents = this.iface.decodeEventLog(
          'responseAdded',
          log.data,
          log.topics,
        );
        console.log({ decodedEvents });
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  private async triggerRandomNumberGenerator(surveyId: number) {
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
      console.log('triggering random number generator');
      await surveyProtocol.triggerRandomNumberGenerator(surveyId);
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}

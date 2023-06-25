import { Injectable } from '@nestjs/common';
import { Alchemy, Network } from 'alchemy-sdk';
import { alchemyInstance } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class ENSService {
  ensContractAddress: string;
  alchemy: Alchemy;
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('ENSService');
    this.ensContractAddress = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85';
    this.alchemy = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY_MAINNET,
      network: Network.ETH_MAINNET,
    });
  }

  async resolveENSName(ethAddress: string): Promise<any> {
    const addr = await this.alchemy.core.lookupAddress(ethAddress);
    return addr;
  }

  async resolveAddress(ensName: string): Promise<string> {
    const address = await this.alchemy.core.resolveName(ensName);
    return address;
  }
}

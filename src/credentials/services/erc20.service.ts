import { AnkrProvider, Balance, Blockchain } from '@ankr.com/ankr.js';
import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class ERC20Service {
  provider: AnkrProvider;

  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('ERC20Service');
    this.provider = new AnkrProvider(process.env.ANKR_ENDPOINT);
  }

  async getBalancesOfUser(
    blockchains: Blockchain[],
    walletAddress: string,
    onlyWhitelisted?: boolean,
    filteredTokens?: {
      blockchain: string;
      contractAddress: string;
    }[],
  ): Promise<Balance[]> {
    const balances = await this.provider.getAccountBalance({
      blockchain: blockchains,
      walletAddress,
      onlyWhitelisted,
    });
    let assets = balances.assets;
    if (filteredTokens) {
      assets = assets.filter((asset) => {
        const found = filteredTokens.find(
          (token) =>
            token.blockchain === asset.blockchain &&
            token.contractAddress === asset.contractAddress,
        );
        return found;
      });
    }

    return assets;
  }
}

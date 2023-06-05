import { AnkrProvider } from '@ankr.com/ankr.js';
import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { GetTokenMetadataQuery } from '../impl/get-token-metadata.query';
import { alchemyInstance } from 'src/common/common.service';

@QueryHandler(GetTokenMetadataQuery)
export class GetTokenMetadataQueryHandler
  implements IQueryHandler<GetTokenMetadataQuery>
{
  provider: AnkrProvider;

  constructor(private readonly logger: LoggingService) {
    this.provider = new AnkrProvider(process.env.ANKR_ENDPOINT);

    this.logger.setContext('GetTokenMetadataQueryHandler');
  }

  async execute(query: GetTokenMetadataQuery): Promise<any> {
    try {
      const { chainId, contractAddress, tokenId } = query;
      const tokenMetadata = await this.provider.getNFTMetadata({
        blockchain: chainId,
        contractAddress,
        tokenId: tokenId || '0',
        forceFetch: false,
      });

      return tokenMetadata;
    } catch (error) {
      this.logger.error(`Failed getting user me with error: ${error}`);
      throw new InternalServerErrorException(`Failed getting user me`, error);
    }
  }
}

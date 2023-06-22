import { AnkrProvider } from '@ankr.com/ankr.js';
import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import {
  GetContractMetadataQuery,
  GetTokenMetadataQuery,
} from '../impl/get-token-metadata.query';
import { alchemyInstance } from 'src/common/common.service';
import { Nft, NftContract } from 'alchemy-sdk';

@QueryHandler(GetTokenMetadataQuery)
export class GetTokenMetadataQueryHandler
  implements IQueryHandler<GetTokenMetadataQuery>
{
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('GetTokenMetadataQueryHandler');
  }

  async execute(query: GetTokenMetadataQuery): Promise<Nft> {
    try {
      const { chainId, contractAddress, tokenId } = query;
      const alchemy = alchemyInstance(chainId);
      return await alchemy.nft.getNftMetadata(contractAddress, tokenId);
    } catch (error) {
      this.logger.error(`Failed getting nft with error: ${error}`);
      throw new InternalServerErrorException(error);
    }
  }
}

@QueryHandler(GetContractMetadataQuery)
export class GetContractMetadataQueryHandler
  implements IQueryHandler<GetContractMetadataQuery>
{
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('GetContractMetadataQueryHandler');
  }

  async execute(query: GetContractMetadataQuery): Promise<NftContract> {
    try {
      const { chainId, contractAddress } = query;
      const alchemy = alchemyInstance(chainId);
      return await alchemy.nft.getContractMetadata(contractAddress);
    } catch (error) {
      this.logger.error(`Failed getting nft conract with error: ${error}`);
      throw new InternalServerErrorException(error);
    }
  }
}

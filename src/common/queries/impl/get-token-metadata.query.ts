import { Blockchain } from '@ankr.com/ankr.js';

export class GetTokenMetadataQuery {
  constructor(
    public readonly chainId: Blockchain,
    public readonly contractAddress: string,
    public readonly tokenId?: string,
  ) {}
}

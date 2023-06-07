import { Blockchain } from '@ankr.com/ankr.js';
import { User } from 'src/users/model/users.model';

export class GetTokensOfUserQuery {
  constructor(
    public readonly user: User,
    public readonly tokenType: string,
    public readonly circleId: string,
  ) {}
}

export class GetTokensOfMultipleTokenTypesOfUserQuery {
  constructor(
    public readonly user: User | string,
    public readonly tokens: {
      tokenType: 'erc20' | 'erc721' | 'erc1155' | 'kudos' | 'poap';
      contractAddress: string;
      tokenId?: number;
      tokenAttributes?: {
        key: string;
        value: string;
      }[];
      chainName?: Blockchain;
      chainId: number;
    }[],
  ) {}
}

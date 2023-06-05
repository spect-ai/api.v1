import { User } from 'src/users/model/users.model';

export class GetTokensCommand {
  constructor(
    public readonly user: User,
    public readonly tokenType: string,
    public readonly circleId: string,
  ) {}
}

export class CheckUserTokensCommand {
  constructor(
    public readonly user: User,
    public readonly tokens: {
      tokenType: 'erc20' | 'erc721' | 'erc1155';
      contractAddress: string;
      metadata: {
        name: string;
        image: string;
      };
      tokenId?: number;
      chainId: number;
    }[],
  ) {}
}

export class GetTokenMetadataCommand {
  constructor(
    public readonly chainId: string,
    public readonly tokenType: string,
    public readonly tokenAddress: string,
    public readonly tokenId?: string,
  ) {}
}

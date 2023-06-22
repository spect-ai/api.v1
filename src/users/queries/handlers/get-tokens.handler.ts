import { ICommandHandler, QueryHandler } from '@nestjs/cqrs';
import { ethers } from 'ethers';
import { CommonTools } from 'src/common/common.service';
import { blockchainToChainIdMap } from 'src/constants';
import { ERC20Service } from 'src/credentials/services/erc20.service';
import { ERC721Service } from 'src/credentials/services/erc721.service';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { PoapService } from 'src/credentials/services/poap.service';
import { LoggingService } from 'src/logging/logging.service';
import {
  GetTokensOfMultipleTokenTypesOfUserQuery,
  GetTokensOfUserQuery,
} from '../impl/get-tokens.query';

@QueryHandler(GetTokensOfUserQuery)
export class GetTokensOfUserQueryHandler
  implements ICommandHandler<GetTokensOfUserQuery>
{
  constructor(
    private readonly poapService: PoapService,
    private readonly kudosService: MintKudosService,
    private readonly logger: LoggingService,
    private readonly erc20Service: ERC20Service,
    private readonly erc721Service: ERC721Service,
  ) {
    this.logger.setContext('GetTokensOfUserQueryHandler');
  }

  async execute(query: GetTokensOfUserQuery) {
    try {
      const { user, tokenType, circleId } = query;
      let userAddress;
      if (typeof user === 'string') {
        userAddress = user;
      } else {
        userAddress = user.ethAddress;
      }
      if (!ethers.utils.isAddress(userAddress)) {
        throw new Error('Invalid ethereum address');
      }
      if (tokenType === 'erc20') {
        return await this.erc20Service.getBalancesOfUser(
          ['bsc', 'eth', 'polygon', 'avalanche', 'arbitrum', 'optimism'],
          userAddress,
          true,
        );
      } else if (tokenType === 'nft') {
        return await this.erc721Service.getAllNFTsOfUser(userAddress);
      } else if (tokenType === 'kudos') {
        const credentials = await this.kudosService.getKudosByAddress(
          userAddress,
        );
        const spaceKudos = await this.kudosService.getSpaceKudos(circleId);
        const userKudos = this.kudosService.mapToCredentials(credentials);
        for (const kudo of spaceKudos) {
          if (!userKudos.find((uk) => uk.id === kudo.id)) {
            userKudos.unshift(kudo);
          }
        }
        return userKudos;
      } else if (tokenType === 'poaps') {
        const userPoaps = await this.poapService.getPoapsByAddress(userAddress);
        const spacePoaps = await this.poapService.getSpacePoaps(circleId);
        for (const poap of spacePoaps) {
          if (!userPoaps.find((up) => up.id === poap.id)) {
            userPoaps.unshift(poap);
          }
        }
        return userPoaps;
      }
    } catch (error) {
      console.log({ error });
      this.logger.error(
        `Failed adding item to user with error: ${error.message}`,
        query,
      );
      throw error;
    }
  }
}

@QueryHandler(GetTokensOfMultipleTokenTypesOfUserQuery)
export class GetTokensOfMultipleTokenTypesOfUserQueryHandler
  implements ICommandHandler<GetTokensOfMultipleTokenTypesOfUserQuery>
{
  constructor(
    private readonly poapService: PoapService,
    private readonly kudosService: MintKudosService,
    private readonly erc20Service: ERC20Service,
    private readonly erc721Service: ERC721Service,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('GetTokensOfMultipleTokenTypesOfUserQueryHandler');
  }

  async execute(query: GetTokensOfMultipleTokenTypesOfUserQuery) {
    try {
      const { user, tokens } = query;
      let userAddress;
      if (typeof user === 'string') {
        userAddress = user;
      } else {
        userAddress = user.ethAddress;
      }
      if (!ethers.utils.isAddress(userAddress)) {
        throw new Error('Invalid ethereum address');
      }

      const lookupTokensWithBalances = [] as typeof tokens[number] &
        {
          balance: number;
        }[];

      const kudosTokens = tokens.filter((token) => token.tokenType === 'kudos');

      const kudosTokenIds = kudosTokens.map((token) =>
        token.tokenId?.toString(),
      );
      const kudosHeldByUser = await this.kudosService.getKudosByAddress(
        userAddress,
        undefined,
        undefined,
        kudosTokenIds,
      );
      const objectifiedKudos = this.commonTools.objectify(
        kudosTokens,
        'tokenId',
      );
      lookupTokensWithBalances.push(
        ...kudosHeldByUser.map((kudo) => ({
          ...objectifiedKudos[kudo.kudosTokenId],
          balance: 1,
        })),
      );

      const erc20Tokens = tokens.filter((token) => token.tokenType === 'erc20');
      const erc20HeldByUser = await this.erc20Service.getBalancesOfUser(
        ['bsc', 'eth', 'polygon', 'avalanche', 'arbitrum', 'optimism'],
        userAddress,
        false,
        erc20Tokens.map((token) => ({
          blockchain:
            token.chainName || blockchainToChainIdMap[token.chainId.toString()],
          contractAddress: token.contractAddress,
        })),
      );
      const objectifiedErc20 = erc20Tokens.reduce((acc, token) => {
        acc[
          `${blockchainToChainIdMap[token.chainName]}-${token.contractAddress}`
        ] = token;
        return acc;
      }, {});
      lookupTokensWithBalances.push(
        ...erc20HeldByUser.map((erc20) => ({
          ...objectifiedErc20[
            `${blockchainToChainIdMap[erc20.blockchain]}-${
              erc20.contractAddress
            }`
          ],
          balance: erc20.balance,
        })),
      );

      const erc721HeldByUser = await this.erc721Service.getFilteredNFTsOfUser(
        userAddress,
        tokens.filter(
          (token) =>
            token.tokenType === 'erc721' || token.tokenType === 'erc1155',
        ),
      );
      lookupTokensWithBalances.push(...erc721HeldByUser);

      const poaps = tokens.filter((token) => token.tokenType === 'poap');
      const poapEventIds = poaps.map((token) => token.contractAddress);
      const poapsHeldByUser = await this.poapService.getPoapsByAddress(
        userAddress,
        poapEventIds,
      );
      const objectifiedPoaps = this.commonTools.objectify(
        poaps,
        'contractAddress',
      );
      lookupTokensWithBalances.push(
        ...poapsHeldByUser.map((poap) => ({
          ...objectifiedPoaps[poap.event.id],
          balance: 1,
        })),
      );

      return lookupTokensWithBalances;
    } catch (error) {
      console.log({ error });
      this.logger.error(
        `Failed adding item to user with error: ${error.message}`,
        query,
      );
      throw error;
    }
  }
}

import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import {
  CheckUserTokensCommand,
  GetTokenMetadataCommand,
  GetTokensCommand,
} from '../impl/get-tokens.command';
import { Alchemy, Network, NftExcludeFilters } from 'alchemy-sdk';
import { PoapService } from 'src/credentials/services/poap.service';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { User } from 'src/users/model/users.model';
import { GetRegistryCommand } from 'src/circle/commands/impl';
import { AnkrProvider } from '@ankr.com/ankr.js';

@CommandHandler(GetTokensCommand)
export class GetTokensCommandHandler
  implements ICommandHandler<GetTokensCommand>
{
  provider: AnkrProvider;
  constructor(
    private readonly poapService: PoapService,
    private readonly kudosService: MintKudosService,
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
  ) {
    this.provider = new AnkrProvider(process.env.ANKR_ENDPOINT);

    this.logger.setContext('GetTokensCommandHandler');
  }

  async execute(command: GetTokensCommand) {
    try {
      const { user, tokenType, circleId } = command;

      if (tokenType === 'erc20') {
        return await this.provider.getAccountBalance({
          blockchain: [
            'bsc',
            'eth',
            'polygon',
            'avalanche',
            'arbitrum',
            'optimism',
          ],
          walletAddress: user.ethAddress,
          onlyWhitelisted: true,
        });
      } else if (tokenType === 'nft') {
        const res = await this.provider.getNFTsByOwner({
          blockchain: [
            'bsc',
            'eth',
            'polygon',
            'avalanche',
            'arbitrum',
            'optimism',
          ],
          walletAddress: user.ethAddress,
          pageSize: 20,
        });

        const returnedNfts = [];
        res.assets.forEach((nft) => {
          if (nft.name) {
            returnedNfts.push(nft);
          }
        });

        return returnedNfts;
      } else if (tokenType === 'kudos') {
        const credentials = await this.kudosService.getKudosByAddress(
          user.ethAddress,
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
        const userPoaps = await this.poapService.getPoapsByAddress(
          user.ethAddress,
        );
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
        command,
      );
      throw error;
    }
  }
}

async function getTokenBalance(
  chainId: string,
  ownerAddress: string,
  contractAddress: string,
) {
  switch (chainId) {
    case '1':
      console.log('ETH');
      const config = {
        apiKey: process.env.ALCHEMY_API_KEY_MAINNET,
        network: Network.ETH_MAINNET,
      };
      const alchemy = new Alchemy(config);
      return await getTokenBalanceHelper(
        alchemy,
        ownerAddress,
        contractAddress,
        chainId,
      );
    case '137':
      console.log('MATIC');
      const configMatic = {
        apiKey: process.env.ALCHEMY_API_KEY_POLYGON,
        network: Network.MATIC_MAINNET,
      };
      const alchemyMatic = new Alchemy(configMatic);
      return await getTokenBalanceHelper(
        alchemyMatic,
        ownerAddress,
        contractAddress,
        chainId,
      );
    case '80001':
      console.log('MUMBAI');
      const configMumbai = {
        apiKey: process.env.ALCHEMY_API_KEY_MUMBAI,
        network: Network.MATIC_MUMBAI,
      };
      const alchemyMumbai = new Alchemy(configMumbai);
      return await getTokenBalanceHelper(
        alchemyMumbai,
        ownerAddress,
        contractAddress,
        chainId,
      );
    case '10':
      console.log('OPTIMISM');
      const configOptimism = {
        apiKey: process.env.ALCHEMY_API_KEY_OPTIMISM,
        network: Network.OPT_MAINNET,
      };
      const alchemyOptimism = new Alchemy(configOptimism);
      return await getTokenBalanceHelper(
        alchemyOptimism,
        ownerAddress,
        contractAddress,
        chainId,
      );
    case '42161':
      console.log('ARBITRUM');
      const configArbitrum = {
        apiKey: process.env.ALCHEMY_API_KEY_ARBITRUM,
        network: Network.ARB_MAINNET,
      };
      const alchemyArbitrum = new Alchemy(configArbitrum);
      return await getTokenBalanceHelper(
        alchemyArbitrum,
        ownerAddress,
        contractAddress,
        chainId,
      );
    default:
      break;
  }
}

async function getTokenBalanceHelper(
  alchemy: Alchemy,
  ownerAddress: string,
  contractAddress: string,
  chainId: string,
) {
  const data = await alchemy.core.getTokenBalances(ownerAddress, [
    contractAddress,
  ]);
  let balance = Number(data.tokenBalances[0].tokenBalance);
  const metadata = await alchemy.core.getTokenMetadata(contractAddress);
  balance = balance / Math.pow(10, metadata.decimals);
  balance = Number(balance.toFixed(2));
  return balance;
}

async function getNFTBalance(
  chainId: string,
  ownerAddress: string,
  contractAddress: string,
  tokenId: string,
  tokenType: 'erc721' | 'erc1155',
) {
  switch (chainId) {
    case '1':
      console.log('ETH');
      const config = {
        apiKey: process.env.ALCHEMY_API_KEY_MAINNET,
        network: Network.ETH_MAINNET,
      };
      const alchemy = new Alchemy(config);
      return await getNFTBalanceHelper(
        alchemy,
        ownerAddress,
        contractAddress,
        tokenId,
      );
    case '137':
      console.log('MATIC');
      const configMatic = {
        apiKey: process.env.ALCHEMY_API_KEY_POLYGON,
        network: Network.MATIC_MAINNET,
      };
      const alchemyMatic = new Alchemy(configMatic);
      return await getNFTBalanceHelper(
        alchemyMatic,
        ownerAddress,
        contractAddress,
        tokenId,
      );
    case '80001':
      console.log('MUMBAI');
      const configMumbai = {
        apiKey: process.env.ALCHEMY_API_KEY_MUMBAI,
        network: Network.MATIC_MUMBAI,
      };
      const alchemyMumbai = new Alchemy(configMumbai);
      return await getNFTBalanceHelper(
        alchemyMumbai,
        ownerAddress,
        contractAddress,
        tokenId,
      );
    case '10':
      console.log('OPTIMISM');
      const configOptimism = {
        apiKey: process.env.ALCHEMY_API_KEY_OPTIMISM,
        network: Network.OPT_MAINNET,
      };
      const alchemyOptimism = new Alchemy(configOptimism);
      return await getNFTBalanceHelper(
        alchemyOptimism,
        ownerAddress,
        contractAddress,
        tokenId,
      );
    case '42161':
      console.log('ARBITRUM');
      const configArbitrum = {
        apiKey: process.env.ALCHEMY_API_KEY_ARBITRUM,
        network: Network.ARB_MAINNET,
      };
      const alchemyArbitrum = new Alchemy(configArbitrum);
      return await getNFTBalanceHelper(
        alchemyArbitrum,
        ownerAddress,
        contractAddress,
        tokenId,
      );
    default:
      break;
  }
}

async function getNFTBalanceHelper(
  alchemy: Alchemy,
  ownerAddress: string,
  contractAddress: string,
  tokenId: string,
) {
  if (!tokenId) {
    const owners = await alchemy.nft.getNftsForOwner(ownerAddress, {
      contractAddresses: [contractAddress],
    });
    const balance = owners.ownedNfts.length;
    return balance;
  } else {
    const owners = await alchemy.nft.getOwnersForNft(contractAddress, tokenId);
    const balance = owners.owners.filter(
      (owner) => owner === ownerAddress,
    ).length;
    return balance;
  }
}

@CommandHandler(CheckUserTokensCommand)
export class CheckUserTokensCommandHandler
  implements ICommandHandler<CheckUserTokensCommand>
{
  constructor(
    private readonly poapService: PoapService,
    private readonly kudosService: MintKudosService,
  ) {}

  async execute(command: CheckUserTokensCommand) {
    const { user, tokens } = command;
    const userBalances = [];
    for await (const token of tokens) {
      if (token.tokenType === 'erc20') {
        const tokenBalance = await getTokenBalance(
          token.chainId.toString(),
          user.ethAddress,
          token.contractAddress,
        );
        userBalances.push({
          ...token,
          balance: tokenBalance,
        });
      } else if (
        token.tokenType === 'erc721' ||
        token.tokenType === 'erc1155'
      ) {
        const tokenBalance = await getNFTBalance(
          token.chainId.toString(),
          user.ethAddress,
          token.contractAddress,
          token.tokenId?.toString(),
          token.tokenType,
        );
        userBalances.push({
          ...token,
          balance: tokenBalance,
        });
      } else if (token.tokenType === 'kudos') {
        const credentials = await this.kudosService.getKudosByAddress(
          user.ethAddress,
        );
        const tokenBalance = [
          credentials.find(
            (credential) =>
              credential.kudosTokenId.toString() === token.contractAddress,
          ),
        ].filter((credential) => credential);
        userBalances.push({
          ...token,
          balance: tokenBalance.length,
        });
      } else if (token.tokenType === 'poap') {
        const userPoaps = await this.poapService.getPoapsByAddress(
          user.ethAddress,
        );
        const tokenBalance = [
          userPoaps.find(
            (userPoap) =>
              userPoap.event.id.toString() === token.contractAddress,
          ),
        ].filter((userPoap) => userPoap);
        userBalances.push({
          ...token,
          balance: tokenBalance.length,
        });
      }
    }
    console.log({ userBalances });
    return userBalances;
  }
}

@CommandHandler(GetTokenMetadataCommand)
export class GetTokenMetadataCommandHandler
  implements ICommandHandler<GetTokenMetadataCommand>
{
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('GetTokensCommandHandler');
  }

  async execute(command: GetTokenMetadataCommand) {
    try {
      const { chainId, tokenType, tokenAddress, tokenId } = command;
      console.log({ chainId, tokenType, tokenAddress, tokenId });
      switch (chainId) {
        case '1':
          console.log('ETH');
          const config = {
            apiKey: process.env.ALCHEMY_API_KEY_MAINNET,
            network: Network.ETH_MAINNET,
          };
          const alchemy = new Alchemy(config);
          if (tokenType === 'erc20') {
            return await alchemy.core.getTokenMetadata(tokenAddress);
          } else if (tokenType === 'nft') {
            if (!tokenId) {
              return await alchemy.nft.getContractMetadata(tokenAddress);
            } else {
              return await alchemy.nft.getNftMetadata(tokenAddress, tokenId);
            }
          }
        case '137':
          console.log('MATIC');
          const configMatic = {
            apiKey: process.env.ALCHEMY_API_KEY_POLYGON,
            network: Network.MATIC_MAINNET,
          };
          const alchemyMatic = new Alchemy(configMatic);
          if (tokenType === 'erc20') {
            return await alchemyMatic.core.getTokenMetadata(tokenAddress);
          } else if (tokenType === 'nft') {
            if (!tokenId) {
              return await alchemy.nft.getContractMetadata(tokenAddress);
            } else {
              return await alchemy.nft.getNftMetadata(tokenAddress, tokenId);
            }
          }
        case '80001':
          console.log('MUMBAI');
          const configMumbai = {
            apiKey: process.env.ALCHEMY_API_KEY_MUMBAI,
            network: Network.MATIC_MUMBAI,
          };
          const alchemyMumbai = new Alchemy(configMumbai);
          if (tokenType === 'erc20') {
            return await alchemyMumbai.core.getTokenMetadata(tokenAddress);
          } else if (tokenType === 'nft') {
            if (!tokenId) {
              return await alchemy.nft.getContractMetadata(tokenAddress);
            } else {
              return await alchemy.nft.getNftMetadata(tokenAddress, tokenId);
            }
          }
        case '10':
          console.log('OPTIMISM');
          const configOptimism = {
            apiKey: process.env.ALCHEMY_API_KEY_OPTIMISM,
            network: Network.OPT_MAINNET,
          };
          const alchemyOptimism = new Alchemy(configOptimism);
          if (tokenType === 'erc20') {
            return await alchemyOptimism.core.getTokenMetadata(tokenAddress);
          } else if (tokenType === 'nft') {
            if (!tokenId) {
              return await alchemy.nft.getContractMetadata(tokenAddress);
            } else {
              return await alchemy.nft.getNftMetadata(tokenAddress, tokenId);
            }
          }
        case '42161':
          console.log('ARBITRUM');
          const configArbitrum = {
            apiKey: process.env.ALCHEMY_API_KEY_ARBITRUM,
            network: Network.ARB_MAINNET,
          };
          const alchemyArbitrum = new Alchemy(configArbitrum);
          if (tokenType === 'erc20') {
            return await alchemyArbitrum.core.getTokenMetadata(tokenAddress);
          } else if (tokenType === 'nft') {
            if (!tokenId) {
              return await alchemy.nft.getContractMetadata(tokenAddress);
            } else {
              return await alchemy.nft.getNftMetadata(tokenAddress, tokenId);
            }
          }

        default:
          break;
      }
    } catch (error) {
      console.log({ error });
      this.logger.error(
        `Failed adding item to user with error: ${error.message}`,
        command,
      );
    }
  }
}

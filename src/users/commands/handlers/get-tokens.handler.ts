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

@CommandHandler(GetTokensCommand)
export class GetTokensCommandHandler
  implements ICommandHandler<GetTokensCommand>
{
  constructor(
    private readonly poapService: PoapService,
    private readonly kudosService: MintKudosService,
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext('GetTokensCommandHandler');
  }

  async execute(command: GetTokensCommand) {
    try {
      const { user, chainId, tokenType, circleId } = command;

      if (tokenType === 'erc20') {
        const userTokens = await getUserTokens(chainId, user);
        const registry = await this.commandBus.execute(
          new GetRegistryCommand(circleId),
        );
        console.log({ userTokens });
        const tokenDetails = registry[chainId].tokenDetails;
        for (const [tokenAddress, token] of Object.entries(tokenDetails)) {
          if (
            tokenAddress !== '0x0' &&
            !userTokens.find(
              (t) =>
                t.contractAddress.toLowerCase() === tokenAddress.toLowerCase(),
            )
          ) {
            const tokenMetadata = await this.commandBus.execute(
              new GetTokenMetadataCommand(chainId, 'erc20', tokenAddress),
            );
            userTokens.push({
              ...tokenMetadata,
              balance: 0,
              contractAddress: tokenAddress,
            });
          }
        }
        return userTokens;
      } else if (tokenType === 'nft') {
        return getUserNFTs(chainId, user);
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
    }
  }
}

async function getUserTokens(chainId: string, user: User) {
  switch (chainId) {
    case '1':
      console.log('ETH');
      const config = {
        apiKey: process.env.ALCHEMY_API_KEY_MAINNET,
        network: Network.ETH_MAINNET,
      };
      const alchemy = new Alchemy(config);
      return await getTokens(alchemy, user.ethAddress);
    case '137':
      console.log('MATIC');
      const configMatic = {
        apiKey: process.env.ALCHEMY_API_KEY_POLYGON,
        network: Network.MATIC_MAINNET,
      };
      const alchemyMatic = new Alchemy(configMatic);
      return await getTokens(alchemyMatic, user.ethAddress);
    case '80001':
      console.log('MUMBAI');
      const configMumbai = {
        apiKey: process.env.ALCHEMY_API_KEY_MUMBAI,
        network: Network.MATIC_MUMBAI,
      };
      const alchemyMumbai = new Alchemy(configMumbai);
      return await getTokens(alchemyMumbai, user.ethAddress);
    case '10':
      console.log('OPTIMISM');
      const configOptimism = {
        apiKey: process.env.ALCHEMY_API_KEY_OPTIMISM,
        network: Network.OPT_MAINNET,
      };
      const alchemyOptimism = new Alchemy(configOptimism);
      return await getTokens(alchemyOptimism, user.ethAddress);
    case '42161':
      console.log('ARBITRUM');
      const configArbitrum = {
        apiKey: process.env.ALCHEMY_API_KEY_ARBITRUM,
        network: Network.ARB_MAINNET,
      };
      const alchemyArbitrum = new Alchemy(configArbitrum);
      return await getTokens(alchemyArbitrum, user.ethAddress);
    default:
      break;
  }
}

async function getTokens(alchemy: Alchemy, ethAddress: string) {
  const balances = await alchemy.core.getTokenBalances(ethAddress);
  const nonZeroBalances = balances.tokenBalances.filter((token) => {
    return Number(token.tokenBalance) !== 0;
  });
  const tokenBalances = [];
  for await (const token of nonZeroBalances) {
    let balance = Number(token.tokenBalance);
    const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);

    // Compute token balance in human-readable format
    balance = balance / Math.pow(10, metadata.decimals);
    balance = Number(balance.toFixed(2));
    tokenBalances.push({
      logo: metadata.logo,
      name: metadata.name,
      symbol: metadata.symbol,
      balance,
      contractAddress: token.contractAddress,
    });
  }
  return tokenBalances;
}

async function getUserNFTs(chainId: string, user: User) {
  switch (chainId) {
    case '1':
      console.log('ETH');
      const config = {
        apiKey: process.env.ALCHEMY_API_KEY_MAINNET,
        network: Network.ETH_MAINNET,
      };
      const alchemy = new Alchemy(config);
      return await getNFTs(alchemy, user.ethAddress);
    case '137':
      console.log('MATIC');
      const configMatic = {
        apiKey: process.env.ALCHEMY_API_KEY_POLYGON,
        network: Network.MATIC_MAINNET,
      };
      const alchemyMatic = new Alchemy(configMatic);
      return await getNFTs(alchemyMatic, user.ethAddress);
    case '80001':
      console.log('MUMBAI');
      const configMumbai = {
        apiKey: process.env.ALCHEMY_API_KEY_MUMBAI,
        network: Network.MATIC_MUMBAI,
      };
      const alchemyMumbai = new Alchemy(configMumbai);
      return await getNFTs(alchemyMumbai, user.ethAddress);
    case '10':
      console.log('OPTIMISM');
      const configOptimism = {
        apiKey: process.env.ALCHEMY_API_KEY_OPTIMISM,
        network: Network.OPT_MAINNET,
      };
      const alchemyOptimism = new Alchemy(configOptimism);
      return await getNFTs(alchemyOptimism, user.ethAddress);
    case '42161':
      console.log('ARBITRUM');
      const configArbitrum = {
        apiKey: process.env.ALCHEMY_API_KEY_ARBITRUM,
        network: Network.ARB_MAINNET,
      };
      const alchemyArbitrum = new Alchemy(configArbitrum);
      return await getNFTs(alchemyArbitrum, user.ethAddress);

    default:
      break;
  }
}

async function getNFTs(alchemy: Alchemy, ethAddress: string) {
  try {
    const nfts = await alchemy.nft.getNftsForOwner(ethAddress, {
      excludeFilters: [NftExcludeFilters.SPAM, NftExcludeFilters.AIRDROPS],
    });
    return nfts.ownedNfts || [];
  } catch (err) {
    const nfts = await alchemy.nft.getNftsForOwner(ethAddress);
    return nfts.ownedNfts || [];
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

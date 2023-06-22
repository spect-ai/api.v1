import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';
import { Alchemy, Network, NftExcludeFilters, OwnedNft } from 'alchemy-sdk';
import { AnkrProvider, Blockchain, Nft } from '@ankr.com/ankr.js';
import { NFTFromAnkr } from '../types/types';
import { alchemyInstance } from 'src/common/common.service';

@Injectable()
export class ERC721Service {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('ERC721Service');
  }

  async getNFTsOnAChain(
    walletAddress: string,
    chainId: string,
  ): Promise<OwnedNft[]> {
    const alchemy = alchemyInstance(chainId);
    try {
      const nfts = await alchemy.nft.getNftsForOwner(walletAddress, {
        excludeFilters: [NftExcludeFilters.SPAM, NftExcludeFilters.AIRDROPS],
      });
      return nfts.ownedNfts || [];
    } catch (err) {
      const nfts = await alchemy.nft.getNftsForOwner(walletAddress);
      return nfts.ownedNfts || [];
    }
  }

  async getAllNFTsOfUser(walletAddress: string): Promise<OwnedNft[]> {
    try {
      let nfts = [];
      const res = [];
      for (const chainId of ['1', '137', '10', '42161']) {
        nfts = await this.getNFTsOnAChain(walletAddress, chainId);
        nfts = nfts.filter((nft) => !nft.metadataError);
        nfts = nfts.map((nft) => {
          return {
            ...nft,
            chainId,
          };
        });
        res.push(...nfts);
      }
      return res;
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  async getNFTBalanceOfUser(
    walletAddress: string,
    chainId: string,
    contractAddress: string,
    tokenId?: string,
    tokenAttributes?: {
      key: string;
      value: string;
    }[],
  ): Promise<number> {
    const alchemy = alchemyInstance(chainId);
    if (!tokenId) {
      const ownedNfts = await alchemy.nft.getNftsForOwner(walletAddress, {
        contractAddresses: [contractAddress],
      });
      if (tokenAttributes) {
        const filteredNfts = ownedNfts.ownedNfts.filter((nft) => {
          const attributes = nft.rawMetadata.attributes;
          for (const tokenAttribute of tokenAttributes) {
            const attribute = attributes.find(
              (attr) =>
                attr.trait_type.toLowerCase() ===
                tokenAttribute.key.toLowerCase(),
            );
            if (!attribute) {
              return false;
            }
            if (
              attribute.value.toLowerCase() !==
              tokenAttribute.value.toLowerCase()
            ) {
              return false;
            }
          }
          return true;
        });
        const balance = filteredNfts.length;
        return balance;
      }
      const balance = ownedNfts.ownedNfts.length;
      return balance;
    } else {
      const owners = await alchemy.nft.getOwnersForNft(
        contractAddress,
        tokenId,
      );
      console.log({ owners });
      const balance = owners.owners.filter(
        (owner) => owner === walletAddress.toLowerCase(),
      ).length;
      return balance;
    }
  }

  async getFilteredNFTsOfUser(
    walletAddress: string,
    filteredTokens: {
      chainId: number;
      contractAddress: string;
      tokenId?: number;
      tokenAttributes?: {
        key: string;
        value: string;
      }[];
    }[],
  ): Promise<OwnedNft[]> {
    const nftsOfUserWithBalance = [];
    for (const token of filteredTokens) {
      const balance = await this.getNFTBalanceOfUser(
        walletAddress,
        token.chainId.toString(),
        token.contractAddress,
        token.tokenId.toString(),
        token.tokenAttributes,
      );
      if (balance > 0) {
        nftsOfUserWithBalance.push({
          balance,
          ...token,
        });
      }
    }
    return nftsOfUserWithBalance;
  }
}

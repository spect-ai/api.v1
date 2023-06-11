import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { CredentialsRepository } from '../credentials.repository';
import { Credentials } from '../model/credentials.model';
import {
  GitcoinPassportCredentials,
  GitcoinPassportMinimalStamp,
} from '../types/types';

@Injectable()
export class GitcoinPassportService {
  constructor(private readonly credentialRepository: CredentialsRepository) {}

  async getAll(): Promise<Credentials[]> {
    return await this.credentialRepository.findAll();
  }

  async hasPassedSybilCheck(
    address: string,
    scores: { [key: string]: number },
  ): Promise<boolean> {
    const { score } = await this.getScoreByEthAddress(address, scores);
    return score >= 100;
  }

  async getStampsByEthAddress(
    ethAddress: string,
  ): Promise<GitcoinPassportCredentials> {
    const res = await fetch(
      `https://api.scorer.gitcoin.co/registry/stamps/${ethAddress}?include_metadata=true`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.GITCOIN_PASSPORT_API_KEY,
        },
      },
    );
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        data.message || 'Something went wrong while fetching passport stamps',
      );

    return data.items;
  }

  async getScoreByEthAddress(
    ethAddress: string,
    scoresOfStamps: {
      [key: string]: number;
    },
    withStamps = false,
    filterStampsWithNoScore = false,
    sortStampsByScore = false,
  ): Promise<{
    score: number;
    stamps: GitcoinPassportMinimalStamp[];
  }> {
    const stampsOfUser = await this.getStampsByEthAddress(ethAddress);
    const providersOfUserStamps = stampsOfUser?.map(
      (stamp) => stamp.credential.credentialSubject.provider,
    );
    const providersOfUserStampsSet = new Set(providersOfUserStamps);

    const stampsLocal = await this.getAll();

    let stamps = [];
    let totalScore = 0;
    for (const stampLocal of stampsLocal) {
      const stamp = {
        ...stampLocal,
        score: scoresOfStamps[stampLocal.id],
        verified: providersOfUserStampsSet.has(stampLocal.provider),
      };
      stamps.push(stamp);
      if (providersOfUserStampsSet.has(stamp.provider))
        totalScore += scoresOfStamps[stamp.id];
    }

    if (withStamps && filterStampsWithNoScore) {
      stamps = stamps.filter((stamp) => stamp.score > 0);
    }
    if (withStamps && sortStampsByScore) {
      stamps = stamps.sort((a, b) => b.score - a.score);
    }

    return {
      score: totalScore,
      stamps: withStamps ? stamps : undefined,
    };
  }
}

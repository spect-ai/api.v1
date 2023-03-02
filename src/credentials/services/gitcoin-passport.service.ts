import { PassportReader } from '@gitcoinco/passport-sdk-reader';
import { Injectable } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { Credential } from 'src/users/types/types';
import { CredentialsRepository } from '../credentials.repository';
import { Credentials } from '../model/credentials.model';
import fetch from 'node-fetch';

@Injectable()
export class GitcoinPassportService {
  constructor(
    private readonly credentialRepository: CredentialsRepository,
    private readonly commonTools: CommonTools,
  ) {}

  private readonly passportUrl = 'https://ceramic.passport-iam.gitcoin.co';

  async getAll(): Promise<Credentials[]> {
    return await this.credentialRepository.findAll();
  }

  async hasPassedSybilCheck(
    address: string,
    scores: { [key: string]: number },
  ): Promise<boolean> {
    const stamps = await this.getAll();
    const passportScores = stamps.map((stamp) => {
      return {
        score: scores[stamp.id] ? scores[stamp.id] : 0,
        provider: stamp.provider,
        issuer: stamp.issuer,
      };
    });
    const passport = await (
      await fetch(
        `https://api.scorer.gitcoin.co/ceramic-cache/stamp?address=${address}`,
      )
    ).json();
    const PassportScorer = (await import('@gitcoinco/passport-sdk-scorer'))
      .PassportScorer;
    const stampsWithCredentials = [];
    if (!passport?.stamps) return false;
    for (const stamp of passport.stamps) {
      if (!stamp.stamp) {
        continue;
      }
      stampsWithCredentials.push({
        ...stamp,
        credential: stamp.stamp,
      });
    }
    const scorer = new PassportScorer(passportScores, this.passportUrl);
    const score = await scorer.getScore(address, {
      ...passport,
      stamps: stampsWithCredentials,
    });
    return score >= 100;
  }

  async getByEthAddress(ethAddress: string): Promise<Credential[]> {
    const stamps = await this.getAll();

    const reader = new PassportReader(this.passportUrl, '1');

    const PassportVerifier = (await import('@gitcoinco/passport-sdk-verifier'))
      .PassportVerifier;

    const verifier = new PassportVerifier(this.passportUrl);
    let passport = await reader.getPassport(ethAddress);
    if (!passport || !passport.stamps) {
      passport = await (
        await fetch(
          `https://api.scorer.gitcoin.co/ceramic-cache/stamp?address=${ethAddress}`,
        )
      ).json();
    }
    if (!passport?.stamps) return [];
    const stampsWithCredentials = [];
    for (const stamp of passport.stamps) {
      if (!stamp.credential) {
        continue;
      }
      const isVerified = (await verifier.verifyStamp(ethAddress, stamp)) as any;
      if (isVerified?.verified) {
        stampsWithCredentials.push(stamp);
      }
    }

    const mappedStampsWithCredentials = this.commonTools.objectify(
      stampsWithCredentials,
      'provider',
    );
    const res = [];
    for (const stamp of stamps) {
      if (mappedStampsWithCredentials[stamp.provider]) {
        res.push({
          id: stamp.provider,
          name: stamp.stampName,
          description: stamp.stampDescription,
          imageUri: stamp.providerImage,
          type: 'vc',
          service: 'gitcoinPassport',
          metadata: {
            providerName: stamp.providerName,
          },
        });
      }
    }

    return res;
  }

  async getPassportStampsAndScore(
    ethAddress: string,
    scores: { [key: string]: number },
  ): Promise<any> {
    const stamps = await this.getAll();
    const passportScores = stamps.map((stamp) => {
      return {
        score: scores[stamp.id] ? scores[stamp.id] : 0,
        provider: stamp.provider,
        issuer: stamp.issuer,
      };
    });
    const passport = await (
      await fetch(
        `https://api.scorer.gitcoin.co/ceramic-cache/stamp?address=${ethAddress}`,
      )
    ).json();
    const PassportScorer = (await import('@gitcoinco/passport-sdk-scorer'))
      .PassportScorer;
    const stampsWithCredentials = [];
    if (!passport?.stamps) return false;
    for (const stamp of passport.stamps) {
      if (!stamp.stamp) {
        continue;
      }
      stampsWithCredentials.push({
        ...stamp,
        credential: stamp.stamp,
      });
    }

    const mappedStampsWithCredentials = this.commonTools.objectify(
      stampsWithCredentials,
      'provider',
    );
    const scorer = new PassportScorer(passportScores, this.passportUrl);
    const score = await scorer.getScore(ethAddress, {
      ...passport,
      stamps: stampsWithCredentials,
    });

    const resMappedStampsWithCredentials = {};
    for (const stamp of stamps) {
      if (mappedStampsWithCredentials[stamp.provider])
        resMappedStampsWithCredentials[stamp.id] = true;
    }

    return {
      mappedStampsWithCredentials: resMappedStampsWithCredentials,
      score,
    };
  }
}

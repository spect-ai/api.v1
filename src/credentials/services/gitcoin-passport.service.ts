import { PassportReader } from '@gitcoinco/passport-sdk-reader';

import { Injectable } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { Credential, VerifiableCredential } from 'src/users/types/types';
import { CredentialsRepository } from '../credentials.repository';
import { Credentials } from '../model/credentials.model';

@Injectable()
export class GitcoinPassportService {
  constructor(
    private readonly credentialRepository: CredentialsRepository,
    private readonly commonTools: CommonTools,
  ) {}

  private readonly passportUrl = 'https://passport-iam.gitcoin.co';

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
    const reader = new PassportReader(this.passportUrl, '1');

    const passport = await reader.getPassport(address);
    const PassportScorer = (await import('@gitcoinco/passport-sdk-scorer'))
      .PassportScorer;
    const stampsWithCredentials = [];
    console.log({ passport: JSON.stringify(passport) });
    if (!passport?.stamps) return false;
    for (const stamp of passport.stamps) {
      if (!stamp.credential) {
        continue;
      }
      stampsWithCredentials.push(stamp);
    }
    const scorer = new PassportScorer(passportScores, this.passportUrl);
    const score = await scorer.getScore(address, {
      ...passport,
      stamps: stampsWithCredentials,
    });
    console.log({ score, stamps: stampsWithCredentials });
    return score >= 100;
  }

  async getByEthAddress(ethAddress: string): Promise<Credential[]> {
    const stamps = await this.getAll();

    const reader = new PassportReader(this.passportUrl, '1');

    const PassportVerifier = (await import('@gitcoinco/passport-sdk-verifier'))
      .PassportVerifier;

    const verifier = new PassportVerifier(this.passportUrl);
    const passport = await reader.getPassport(ethAddress);
    if (!passport) {
      return [];
    }
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
}

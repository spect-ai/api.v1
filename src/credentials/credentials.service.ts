import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { CredentialsRepository } from './credentials.repository';
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { Credentials } from './model/credentials.model';
import { CommonTools } from 'src/common/common.service';
import { PLATFORMS } from 'src/config/platforms';
import { STAMP_PROVIDERS } from 'src/config/providers';
// import { PassportScorer} from '@gitcoinco/passport-sdk-scorer';
import { PassportReader } from '@gitcoinco/passport-sdk-reader';

@Injectable()
export class CredentialsService {
  constructor(private readonly credentialRepository: CredentialsRepository) {}

  async getAll(): Promise<Credentials[]> {
    return await this.credentialRepository.findAll();
  }

  async getById(id: string): Promise<Credentials> {
    return await this.credentialRepository.findById(id);
  }
  async create(
    createCredentialDto: CreateCredentialRequestDto,
  ): Promise<Credentials> {
    try {
      return await this.credentialRepository.create(createCredentialDto);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed credential creation',
        error.message,
      );
    }
  }

  async addAllCredentials(): Promise<boolean> {
    for (const platform of PLATFORMS) {
      if (!STAMP_PROVIDERS[platform.platform]) continue;
      for (const platformGroup of STAMP_PROVIDERS[platform.platform]) {
        for (const provider of platformGroup.providers) {
          const credential = await this.credentialRepository.findOne({
            provider: provider.name,
          } as FilterQuery<Credentials>);
          if (!credential) {
            const createCredentialDto = {
              provider: provider.name,
              providerName: platform.platform,
              providerImage: platform.icon,
              providerUrl: platform.url,
              issuer:
                'did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC',
              issuerName: 'Gitcoin Passport',
              defaultScore: provider.defaultScore,
              stampDescription: provider.description,
              stampName: provider.title,
            } as CreateCredentialRequestDto;
            await this.create(createCredentialDto);
          }
        }
      }
    }
    return true;
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
    const reader = new PassportReader('https://gateway.ceramic.network', '1');

    const passport = await reader.getPassport(address);
    const PassportScorer = (await import('@gitcoinco/passport-sdk-scorer'))
      .PassportScorer;
    const stampsWithCredentials = [];
    for (const stamp of passport.stamps) {
      console.log({ stamp });

      if (!stamp.credential) {
        continue;
      }
      stampsWithCredentials.push(stamp);
    }
    const scorer = new PassportScorer(
      passportScores,
      'https://gateway.ceramic.network',
    );
    const score = await scorer.getScore(address, {
      ...passport,
      stamps: stampsWithCredentials,
    });
    console.log({ score });
    return score >= 100;
  }

  async getNumberOfSimilarStamps(
    address1: string,
    address2: string,
  ): Promise<number> {
    const reader = new PassportReader(
      'https://ceramic.passport-iam.gitcoin.co',
      '1',
    );

    const passport1 = await reader.getPassport(address1);
    const passport2 = await reader.getPassport(address2);

    const stamps1 = passport1.stamps.map((stamp) => stamp.provider);
    const stamps2 = new Set(passport2.stamps.map((stamp) => stamp.provider));
    let numSimilarStamps = 0;
    for (const stamp of stamps1) {
      if (stamps2.has(stamp)) {
        numSimilarStamps++;
      }
    }
    return numSimilarStamps;
  }
}

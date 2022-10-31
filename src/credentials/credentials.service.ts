import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { CredentialsRepository } from './credentials.repository';
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { Credentials } from './model/credentials.model';
import { PassportScorer } from '@gitcoinco/passport-sdk-scorer';
import { CommonTools } from 'src/common/common.service';
import { PLATFORMS } from 'src/config/platforms';
import { STAMP_PROVIDERS } from 'src/config/providers';

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
    const scorer = new PassportScorer(passportScores);
    const score = await scorer.getScore(address);
    console.log(score);
    return score >= 100;
  }
}

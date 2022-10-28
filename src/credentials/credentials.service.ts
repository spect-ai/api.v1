import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { CredentialsRepository } from './credentials.repository';
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { Credentials } from './model/credentials.model';
import { PassportScorer } from '@gitcoinco/passport-sdk-scorer';

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
    return score >= 1;
  }
}

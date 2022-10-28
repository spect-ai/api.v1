import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { CredentialsRepository } from './credentials.repository';
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { Credentials } from './model/credentials.model';

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
}

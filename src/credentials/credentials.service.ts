import { Injectable } from '@nestjs/common';
import { CredentialsRepository } from './credentials.repository';
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
}

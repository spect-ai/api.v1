import { Injectable } from '@nestjs/common';
import { Registry } from './model/registry.model';
import { RegistryRepository } from './registry.repository';

@Injectable()
export class RegistryService {
  constructor(private readonly registryRepository: RegistryRepository) {}

  //   async getRegistry(): Promise<Registry> {
  //     return await this.registryRepository.findAll();
  //   }
}

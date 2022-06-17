import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { RegistryModel } from './model/registry.model';

@Injectable()
export class RegistryRepository extends BaseRepository<RegistryModel> {
  constructor(@InjectModel(RegistryModel) registryModel) {
    super(registryModel);
  }
}

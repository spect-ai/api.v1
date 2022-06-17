import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Registry } from './model/registry.model';

@Injectable()
export class RegistryRepository extends BaseRepository<Registry> {
  constructor(@InjectModel(Registry) Registry) {
    super(Registry);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Secret } from './model/secret.model';

@Injectable()
export class SecretRepository extends BaseRepository<Secret> {
  constructor(@InjectModel(Secret) secretModel) {
    super(secretModel);
  }
}

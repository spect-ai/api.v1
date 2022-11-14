import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Credentials } from './model/credentials.model';

@Injectable()
export class CredentialsRepository extends BaseRepository<Credentials> {
  constructor(@InjectModel(Credentials) credentialModel) {
    super(credentialModel);
  }
}

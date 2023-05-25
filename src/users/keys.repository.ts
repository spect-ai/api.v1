import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Keys } from './model/keys.model';
import { User } from './model/users.model';

@Injectable()
export class KeysRepository extends BaseRepository<Keys> {
  constructor(@InjectModel(Keys) keysModel) {
    super(keysModel);
  }
}

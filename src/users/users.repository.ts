import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { User } from './model/users.model';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(@InjectModel(User) userModel) {
    super(userModel);
  }
}

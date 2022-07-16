import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { User } from './model/users.model';
import { MappedUser } from './types/types';
import mongodb from 'mongodb';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(@InjectModel(User) userModel) {
    super(userModel);
  }

  async bundleUpdatesAndExecute(
    updates: MappedUser,
  ): Promise<mongodb.BulkWriteResult> {
    const queries = [];
    for (const [id, update] of Object.entries(updates)) {
      queries.push(this.updateOneByIdQuery(id, update));
    }
    if (queries.length === 0) return;
    const acknowledgment = await this.bulkWrite(queries);

    if (acknowledgment.hasWriteErrors()) {
      console.log(acknowledgment.getWriteErrors());
      throw new HttpException(
        'Something went wrong while updating payment info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return acknowledgment;
  }
}

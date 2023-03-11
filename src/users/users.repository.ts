import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { User } from './model/users.model';
import { MappedUser, PopulatedUserFields } from './types/types';
import mongodb from 'mongodb';
import { DetailedUserPubliceResponseDto } from './dto/detailed-user-response.dto';
import { FilterQuery, UpdateQuery } from 'mongoose';

const defaultPopulate: PopulatedUserFields = {};

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(@InjectModel(User) userModel) {
    super(userModel);
  }

  async getUserDetailsByUserId(id: string): Promise<User> {
    const user = await this.findById(id)
      .populate('assignedCards')
      .populate('reviewingCards')
      .populate('circles');
    return user;
  }

  async getUserDetailsByUsername(username: string): Promise<User> {
    const user = await this.findOne({ username })
      .populate('assignedCards')
      .populate('reviewingCards')
      .populate('circles');
    return user;
  }

  async updateAndReturnWithPopulatedFields(
    id: string,
    update: UpdateQuery<DetailedUserPubliceResponseDto>,
  ): Promise<DetailedUserPubliceResponseDto> {
    return await this.updateById(id, update)
      .populate('circles')
      .populate('assignedCards')
      .populate('reviewingCards')
      .populate('bookmarks');
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

  async getMultipleUsersByIds(
    ids: string[],
    customPopulate?: PopulatedUserFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<User[]> {
    const query = this.findAll(
      {
        _id: { $in: ids },
      },
      {
        projection: selectedFields || {},
      },
    );
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    try {
      return await query.exec();
    } catch (e) {
      return [];
    }
  }

  async getUserByFilter(
    filterQuery: FilterQuery<User>,
    customPopulate?: PopulatedUserFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<User> {
    const query = this.findOne(filterQuery, {
      projection: selectedFields || {},
    });
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    try {
      return await query.exec();
    } catch (error) {
      return null;
    }
  }

  async getMultipleUsersByFilter(
    filterQuery: FilterQuery<User>,
    customPopulate?: PopulatedUserFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<User[]> {
    const query = this.findAll(filterQuery, {
      projection: selectedFields || {},
    });
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    try {
      return await query.exec();
    } catch (error) {
      return null;
    }
  }
}

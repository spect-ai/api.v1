import { FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class BaseRepository<T, C> {
  constructor(protected readonly entityModel: Model<T>) {}

  async findOne(
    filterQuery: FilterQuery<T>,
    projection?: Record<string, unknown>,
  ): Promise<T | null> {
    return await this.entityModel.findOne(filterQuery, {
      _id: 0,
      __v: 0,
      ...projection,
    });
  }

  async find(filterQuery: FilterQuery<T>): Promise<T[] | null> {
    return await this.entityModel.find(filterQuery);
  }

  async findAll(projection?: Record<string, unknown>): Promise<T[] | null> {
    return await this.entityModel.find(
      {},
      {
        _id: 0,
        __v: 0,
        ...projection,
      },
    );
  }

  async create(createEntityData: C): Promise<T> {
    return await this.entityModel.create(createEntityData);
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<unknown>,
  ): Promise<T | null> {
    return await this.entityModel.findOneAndUpdate(
      filterQuery,
      updateEntityData,
      {
        new: true,
      },
    );
  }

  async deleteMany(filterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = await this.entityModel.deleteMany(filterQuery);
    return deleteResult.deletedCount > 0;
  }
}

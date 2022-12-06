import { InternalServerErrorException } from '@nestjs/common';
import type { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import type { MongoError } from 'mongodb';
import mongodb from 'mongodb';
import {
  Aggregate,
  AggregateOptions,
  CallbackWithoutResult,
  FilterQuery,
  HydratedDocument,
  InsertManyResult,
  MongooseBulkWriteOptions,
  ObjectId,
  PipelineStage,
  QueryOptions as MongooseQueryOptions,
  QueryWithHelpers,
  Types,
  UpdateQuery,
  UpdateWriteOpResult,
} from 'mongoose';
import { MappedItem } from 'src/common/interfaces';
import { BaseModel } from './base.model';

interface QueryOptions {
  lean?: boolean;
  autopopulate?: boolean;
  projection?: Record<string, unknown>;
}

export type EnforceDocumentType<TModel extends BaseModel> = HydratedDocument<
  DocumentType<TModel>,
  Record<string, unknown>,
  Record<string, unknown>
>;

// export type InsertQueryList<TModel extends BaseModel> = InsertManyResult;

export type UpdateQueryList<TModel extends BaseModel> = QueryWithHelpers<
  UpdateWriteOpResult,
  EnforceDocumentType<TModel>
>;

export type QueryList<TModel extends BaseModel> = QueryWithHelpers<
  Array<EnforceDocumentType<TModel>>,
  EnforceDocumentType<TModel>
>;
export type QueryItem<
  TModel extends BaseModel,
  TReturnType = EnforceDocumentType<TModel> | null,
> = QueryWithHelpers<TReturnType, EnforceDocumentType<TModel>>;

export type ModelType<TModel extends BaseModel> = ReturnModelType<
  new (...args: unknown[]) => TModel
>;

export abstract class BaseRepository<TModel extends BaseModel> {
  protected constructor(protected model: ModelType<TModel>) {}

  private static get defaultOptions(): QueryOptions {
    return {
      lean: true,
      autopopulate: true,
      projection: {
        __v: 0,
      },
    };
  }

  private static getQueryOptions(options?: QueryOptions) {
    const mergedOptions = {
      ...BaseRepository.defaultOptions,
      ...(options || {}),
    };
    const option: { virtuals: boolean; autopopulate?: boolean } | null =
      mergedOptions.lean ? { virtuals: true } : null;

    if (option && mergedOptions.autopopulate) {
      option['autopopulate'] = true;
    }

    return {
      lean: option,
      autopopulate: mergedOptions.autopopulate,
      projection: mergedOptions.projection,
    };
  }

  protected static throwMongoError(err: MongoError): void {
    throw new InternalServerErrorException(err, err.errmsg);
  }

  protected toObjectId(id: string) {
    return new Types.ObjectId(id);
  }

  createModel(doc?: Partial<TModel>): TModel {
    return new this.model(doc);
  }

  findAll(
    filterQuery?: FilterQuery<TModel>,
    options?: QueryOptions,
  ): QueryList<TModel> {
    return this.model
      .find(filterQuery)
      .setOptions(BaseRepository.getQueryOptions(options))
      .orFail();
  }

  findOne(
    filterQuery: FilterQuery<TModel>,
    options?: QueryOptions,
  ): QueryItem<TModel> {
    return this.model
      .findOne(filterQuery)
      .setOptions(BaseRepository.getQueryOptions(options));
  }

  findById(id: string, options?: QueryOptions): QueryItem<TModel> {
    return this.model
      .findById(this.toObjectId(id))
      .setOptions(BaseRepository.getQueryOptions(options));
  }

  findByObjectId(id: ObjectId, options?: QueryOptions): QueryItem<TModel> {
    return this.model
      .findById(id)
      .setOptions(BaseRepository.getQueryOptions(options));
  }

  create(item: Partial<TModel>): Promise<DocumentType<TModel> | null> {
    try {
      return this.model.create(item);
    } catch (e) {
      BaseRepository.throwMongoError(e);
    }
    return null;
  }

  insertMany(
    items: Partial<TModel[]>,
    options?: QueryOptions,
  ): Promise<HydratedDocument<DocumentType<TModel>>[]> {
    const b = this.model.insertMany(items, options);

    return b;
  }

  deleteOne(
    filterQuery: FilterQuery<TModel>,
    options?: QueryOptions,
  ): QueryItem<TModel> {
    return this.model
      .findOneAndDelete(filterQuery)
      .setOptions(BaseRepository.getQueryOptions(options));
  }

  deleteById(id: string, options?: QueryOptions): QueryItem<TModel> {
    return this.model
      .findByIdAndDelete(this.toObjectId(id))
      .setOptions(BaseRepository.getQueryOptions(options));
  }

  deleteMany(filter: FilterQuery<TModel>, options?: QueryOptions): any {
    try {
      return this.model
        .deleteMany(filter)
        .setOptions(BaseRepository.getQueryOptions(options));
    } catch (e) {
      BaseRepository.throwMongoError(e);
    }
    return null;
  }

  update(item: Partial<TModel>, options?: QueryOptions): QueryItem<TModel> {
    return this.model
      .findByIdAndUpdate(
        this.toObjectId(item.id),
        { $set: item } as UpdateQuery<DocumentType<TModel>>,
        { upsert: true, new: true },
      )
      .setOptions(BaseRepository.getQueryOptions(options));
  }

  updateById(
    id: string,
    updateQuery: UpdateQuery<DocumentType<TModel>>,
    updateOptions: MongooseQueryOptions & { multi?: boolean } = {},
    options?: QueryOptions,
  ): QueryItem<TModel> {
    return this.updateByFilter(
      { _id: this.toObjectId(id) } as FilterQuery<DocumentType<TModel>>,
      updateQuery,
      updateOptions,
      options,
    );
  }

  updateByFilter(
    filter: FilterQuery<DocumentType<TModel>> = {},
    updateQuery: UpdateQuery<DocumentType<TModel>>,
    updateOptions: Omit<MongooseQueryOptions, 'new'> = {},
    options?: QueryOptions,
  ): QueryItem<TModel> {
    return this.model
      .findOneAndUpdate(
        filter,
        updateQuery,
        Object.assign({ new: true }, updateOptions),
      )
      .setOptions(BaseRepository.getQueryOptions(options));
  }

  updateMany(
    filter: FilterQuery<DocumentType<TModel>> = {},
    updateQuery: UpdateQuery<DocumentType<TModel>>,
    updateOptions: MongooseQueryOptions & { multi?: boolean } = {},
    options?: QueryOptions,
  ): UpdateQueryList<TModel> {
    const b = this.model
      .updateMany(filter, updateQuery, updateOptions)
      .setOptions(options)
      .orFail();

    return b;
  }

  count(
    filter: FilterQuery<DocumentType<TModel>> = {},
  ): QueryItem<TModel, number> {
    return this.model.count(filter);
  }

  async countAsync(
    filter: FilterQuery<DocumentType<TModel>> = {},
  ): Promise<number> {
    try {
      return await this.count(filter).exec();
    } catch (e) {
      BaseRepository.throwMongoError(e);
    }
    return 0;
  }

  async exists(
    filter: FilterQuery<DocumentType<TModel>> = {},
  ): Promise<boolean> {
    try {
      return (await this.model.exists(filter)) as unknown as boolean;
    } catch (e) {
      BaseRepository.throwMongoError(e);
    }
    return false;
  }

  aggregate(
    pipeline: PipelineStage[],
    options?: AggregateOptions,
  ): Aggregate<Array<any>> {
    try {
      return this.model.aggregate(pipeline, options);
    } catch (e) {
      BaseRepository.throwMongoError(e);
    }
  }

  async bulkWrite(
    writes: any,
    options?: MongooseBulkWriteOptions,
  ): Promise<any> {
    try {
      return this.model.bulkWrite(writes, options);
    } catch (e) {
      BaseRepository.throwMongoError(e);
    }
  }

  updateOneByIdQuery(id: string, update: mongodb.UpdateFilter<TModel>): any {
    const _id = this.toObjectId(id);
    return {
      updateOne: {
        filter: { _id },
        update: update,
      },
    };
  }

  updateManyByIdsQuery(
    ids: string[],
    update: mongodb.UpdateFilter<TModel>,
  ): any {
    return {
      updateMany: {
        filter: { _id: { $in: ids } },
        update: update,
      },
    };
  }

  addToUpdateOneQuery(
    currUpdate: mongodb.UpdateFilter<TModel>,
    newUpdate: mongodb.UpdateFilter<TModel>,
  ): mongodb.UpdateFilter<TModel> {
    for (const [key, val] of Object.entries(newUpdate)) {
      if (currUpdate.hasOwnProperty(key)) {
        currUpdate[key] = {
          ...currUpdate[key],
          ...val,
        };
      } else {
        currUpdate[key] = val;
      }
    }
    return currUpdate;
  }

  async bundleAndExecuteUpdates(
    updates: MappedItem<Partial<TModel>>,
  ): Promise<mongodb.BulkWriteResult> {
    try {
      const queries = [];
      for (const [id, update] of Object.entries(updates)) {
        queries.push(this.updateOneByIdQuery(id, update));
      }
      if (queries.length === 0) return;
      const acknowledgment = await this.bulkWrite(queries);
      if (acknowledgment.hasWriteErrors()) {
        throw new Error(
          `Some errors occurred: ${JSON.stringify(
            acknowledgment.getWriteErrors(),
          )}`,
        );
      }
      return acknowledgment;
    } catch (e) {
      BaseRepository.throwMongoError(e);
    }
  }
}

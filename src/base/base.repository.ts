import { InternalServerErrorException } from '@nestjs/common';
import type { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import type { MongoError } from 'mongodb';
import {
  FilterQuery,
  HydratedDocument,
  ObjectId,
  QueryOptions as MongooseQueryOptions,
  QueryWithHelpers,
  Types,
  UpdateQuery,
} from 'mongoose';
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
      return (await this.model.exists(filter)) as boolean;
    } catch (e) {
      BaseRepository.throwMongoError(e);
    }
    return false;
  }
}

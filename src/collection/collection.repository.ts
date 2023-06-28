import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Collection } from './model/collection.model';
import { PopulatedCollectionFields } from './types/types';

const defaultPopulate: PopulatedCollectionFields = {
  parents: {
    id: 1,
    name: 1,
    slug: 1,
    pricingPlan: 1,
  },
};

@Injectable()
export class CollectionRepository extends BaseRepository<Collection> {
  constructor(@InjectModel(Collection) collectionModel) {
    super(collectionModel);
  }

  async getCollectionById(
    id: string,
    customPopulate?: PopulatedCollectionFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Collection> {
    const query = this.findById(id, {
      projection: selectedFields || {},
    });
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    return await query.exec();
  }

  async getCollections(
    filterQuery: FilterQuery<Collection>,
    customPopulate?: PopulatedCollectionFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Collection[]> {
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
      return [];
    }
  }

  async getCollectionBySlug(
    slug: string,
    customPopulate?: PopulatedCollectionFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Collection> {
    const query = this.findOne(
      {
        slug: slug,
      },
      {
        projection: selectedFields || {},
      },
    );
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    console.log(populatedFields);

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    return await query.exec();
  }

  async getCollectionByFilter(
    filterQuery: FilterQuery<Collection>,
    customPopulate?: PopulatedCollectionFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Collection> {
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
}

import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Retro } from './models/retro.model';
import { PopulatedRetroFields } from './types';

const defaultPopulate: PopulatedRetroFields = {
  circle: {
    _id: 1,
    name: 1,
  },
};
@Injectable()
export class RetroRepository extends BaseRepository<Retro> {
  constructor(@InjectModel(Retro) circleModel) {
    super(circleModel);
  }

  async getRetroById(
    id: string,
    customPopulate?: PopulatedRetroFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Retro> {
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

  async getRetros(
    filterQuery: FilterQuery<Retro>,
    customPopulate?: PopulatedRetroFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Retro[]> {
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

  async getRetroBySlug(
    slug: string,
    customPopulate?: PopulatedRetroFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Retro> {
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

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    return await query.exec();
  }
}

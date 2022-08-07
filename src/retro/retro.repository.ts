import { Injectable } from '@nestjs/common';
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

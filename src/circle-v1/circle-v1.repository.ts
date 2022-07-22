import { Injectable } from '@nestjs/common';
import { UpdateQuery } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Circle } from './model/circle-v1.model';
import { PopulatedCircleFields } from './types';

const defaultPopulate: PopulatedCircleFields = {
  parents: {
    name: 1,
  },
  children: {
    name: 1,
    description: 1,
  },
  projects: {
    name: 1,
    description: 1,
  },
};
@Injectable()
export class CirclesRepository extends BaseRepository<Circle> {
  constructor(@InjectModel(Circle) circleModel) {
    super(circleModel);
  }

  async getCircleById(
    id: string,
    customPopulate?: PopulatedCircleFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Circle> {
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

  async getCircleBySlug(
    slug: string,
    customPopulate?: PopulatedCircleFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Circle> {
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

  async updateCircle(
    id: string,
    update: UpdateQuery<Circle>,
    customPopulate?: PopulatedCircleFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Circle> {
    const query = this.updateById(id, update, {
      projection: selectedFields || {},
    });
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    return await query.exec();
  }

  async getParentCirclesByUser(user: string): Promise<Circle[]> {
    const circles = await this.findAll({
      parents: { $exists: true, $eq: [] },
      members: { $in: [user] },
    });
    return circles;
  }

  async getPublicParentCircles(): Promise<Circle[]> {
    return await this.findAll({
      parents: { $exists: true, $eq: [] },
      private: false,
    });
  }
}

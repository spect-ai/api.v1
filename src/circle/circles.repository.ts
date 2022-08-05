import { Injectable } from '@nestjs/common';
import { FilterQuery, ObjectId, UpdateQuery } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Circle } from './model/circle.model';
import { PopulatedCircleFields } from './types';

const defaultPopulate: PopulatedCircleFields = {
  parents: {
    id: 1,
    name: 1,
    slug: 1,
  },
  children: {
    id: 1,
    name: 1,
    description: 1,
    slug: 1,
  },
  projects: {
    id: 1,
    name: 1,
    description: 1,
    slug: 1,
  },
};

@Injectable()
export class CirclesRepository extends BaseRepository<Circle> {
  constructor(@InjectModel(Circle) circleModel) {
    super(circleModel);
  }

  async getCircle(id: string): Promise<Circle> {
    return await this.findById(id).exec();
  }

  async getCircleWithPopulatedReferences(id: string): Promise<Circle> {
    return await this.findById(id)
      .populate('parents')
      .populate('children')
      .populate('projects')
      .populate('retro')
      .exec();
  }

  async getCircleWithPopulatedReferencesBySlug(slug: string): Promise<Circle> {
    return await this.findOne({ slug: slug })
      .populate('parents')
      .populate('children')
      .populate('projects')
      .populate('retro')
      .exec();
  }

  async updateCircleAndReturnWithPopulatedReferences(
    id: string,
    update: UpdateQuery<Circle>,
  ) {
    return await this.updateById(id, update)
      .populate('parents')
      .populate('children')
      .populate('projects')
      .populate('retro');
  }

  async getParentCirclesByUser(user: string): Promise<Circle[]> {
    const circles = await this.findAll({
      parents: { $exists: true, $eq: [] },
      members: { $in: [user] },
    });
    return circles;
  }

  async getCircleWithUnpopulatedReferences(id: string): Promise<Circle> {
    return await this.findById(id);
  }

  async getCircleWithUnpopulatedReferencesBySlug(
    slug: string,
  ): Promise<Circle> {
    return await this.findOne({ slug: slug }).exec();
  }

  async getPublicParentCircles(): Promise<Circle[]> {
    return await this.findAll({
      parents: { $exists: true, $eq: [] },
      private: false,
    });
  }

  async getDefaultPayment(id: ObjectId) {
    const circle = await this.findByObjectId(id);
    return circle.defaultPayment;
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

  async getCircles(
    filterQuery: FilterQuery<Circle>,
    customPopulate?: PopulatedCircleFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Circle[]> {
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
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Circle } from './model/circle.model';
import { Ref } from '@typegoose/typegoose';
import { ObjectId, Types, UpdateQuery } from 'mongoose';
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
      .exec();
  }

  async getCircleWithPopulatedReferencesBySlug(slug: string): Promise<Circle> {
    return await this.findOne({ slug: slug })
      .populate('parents')
      .populate('children')
      .populate('projects')
      .exec();
  }

  async updateCircleAndReturnWithPopulatedReferences(
    id: string,
    update: UpdateQuery<Circle>,
  ) {
    return await this.updateById(id, update)
      .populate('parents')
      .populate('children')
      .populate('projects');
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
    console.log(slug);
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
}

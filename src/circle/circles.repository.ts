import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Circle } from './model/circle.model';
import { Ref } from '@typegoose/typegoose';
import { ObjectId, Types } from 'mongoose';
@Injectable()
export class CirclesRepository extends BaseRepository<Circle> {
  constructor(@InjectModel(Circle) circleModel) {
    super(circleModel);
  }

  async getCircleWithPopulatedReferences(id: string): Promise<Circle> {
    return await this.findById(id)
      .populate('parents')
      .populate('children')
      .populate('members')
      .populate('projects')
      .exec();
  }
  async getCircleWithPopulatedReferencesBySlug(slug: string): Promise<Circle> {
    return await this.findOne({ slug: slug })
      .populate('parents')
      .populate('children')
      .populate('members')
      .populate('projects')
      .exec();
  }

  async getCircleWithUnpopulatedReferences(id: string): Promise<Circle> {
    return await this.findById(id);
  }

  async getPublicParentCircles(): Promise<Circle[]> {
    return await this.findAll({
      parents: { $exists: true, $eq: [] },
      private: false,
    });
  }

  async getParentCirclesOfUser(userId: string): Promise<Circle[]> {
    return await this.findAll({
      parents: { $exists: true, $eq: [] },
      // members: { $is: [] }, TODO: implement
    });
  }

  async getDefaultPayment(id: ObjectId) {
    const circle = await this.findByObjectId(id);
    return circle.defaultPayment;
  }
}

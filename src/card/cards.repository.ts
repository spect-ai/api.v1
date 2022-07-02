import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Card } from './model/card.model';
import { Ref } from '@typegoose/typegoose';

const populatedCardFields = {
  title: 1,
  labels: 1,
  assignee: 1,
  reviewer: 1,
  reward: 1,
  priority: 1,
  deadline: 1,
  slug: 1,
  type: 1,
  project: 1,
  creator: 1,
  status: 1,
  parent: 1,
  children: 1,
};
@Injectable()
export class CardsRepository extends BaseRepository<Card> {
  constructor(@InjectModel(Card) circleModel) {
    super(circleModel);
  }

  async getCardWithPopulatedReferences(id: string): Promise<Card> {
    return await this.findById(id).exec();
  }

  async getCardWithPopulatedReferencesBySlug(
    project: string,
    slug: string,
  ): Promise<Card> {
    return await this.findOne({
      project: project,
      slug: slug,
    })
      .populate('project')
      .populate('children', populatedCardFields)
      .populate('parent', populatedCardFields);
  }

  async getCardWithUnpopulatedReferences(id: string): Promise<Card> {
    return await this.findById(id);
  }

  async updateCardAndReturnWithPopulatedReferences(
    id: string,
    update: any,
  ): Promise<Card> {
    return await this.updateById(id, update)
      .populate('project')
      .populate('children', populatedCardFields)
      .populate('parent', populatedCardFields);
  }

  async getCardWithAllChildren(project: string, slug: string) {
    const children = await this.findOne({
      project: project,
      slug: slug,
    }).populate({
      path: 'children',
      populate: {
        path: 'children',
      },
    });
    return children;
  }
}

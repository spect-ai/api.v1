import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Card, ExtendedCard } from './model/card.model';
import mongodb from 'mongodb';
import { UpdateWriteOpResult } from 'mongoose';

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
  constructor(@InjectModel(Card) cardModel) {
    super(cardModel);
  }

  async getCardWithPopulatedReferences(id: string): Promise<Card> {
    return await this.findById(id).populate('project').exec();
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

  async getCardWithAllChildren(id: string): Promise<ExtendedCard> {
    const cards = await this.aggregate([
      {
        $match: {
          _id: this.toObjectId(id),
        },
      },
      {
        $graphLookup: {
          from: 'cards',
          startWith: '$children',
          connectFromField: 'children',
          connectToField: '_id',
          as: 'flattenedChildren',
        },
      },
    ]);
    return cards[0];
  }

  async getCardWithAllChildrenForMultipleCards(
    cardIds: string[],
  ): Promise<ExtendedCard[]> {
    const cards = await this.aggregate([
      {
        $match: {
          _id: { $in: cardIds.map((a) => this.toObjectId(a)) },
        },
      },
      {
        $graphLookup: {
          from: 'cards',
          startWith: '$children',
          connectFromField: 'children',
          connectToField: '_id',
          as: 'flattenedChildren',
        },
      },
    ]);
    return cards;
  }

  async updateManyByIds(
    ids: string[],
    update: any,
  ): Promise<UpdateWriteOpResult> {
    return await this.updateMany(
      {
        _id: { $in: ids },
      },
      update,
      {
        multi: true,
      },
    );
  }
}

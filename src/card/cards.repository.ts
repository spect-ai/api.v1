import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Card, ExtendedCard } from './model/card.model';
import { UpdateQuery, UpdateWriteOpResult } from 'mongoose';
import { MappedCard } from './types/types';
import mongodb from 'mongodb';

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

const populatedCardFieldsOnProject = {
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
  id: 1,
};

@Injectable()
export class CardsRepository extends BaseRepository<Card> {
  constructor(@InjectModel(Card) cardModel) {
    super(cardModel);
  }

  async getCardWithPopulatedReferences(id: string): Promise<Card> {
    return await this.findById(id)
      .populate({
        path: 'project',
        populate: { path: 'cards', select: populatedCardFieldsOnProject },
      })
      .populate('children', populatedCardFields)
      .populate('parent', populatedCardFields);
  }

  async getCardWithPopulatedReferencesBySlug(
    project: string,
    slug: string,
  ): Promise<Card> {
    return await this.findOne({
      project: project,
      slug: slug,
    })
      .populate({
        path: 'project',
        populate: { path: 'cards', select: populatedCardFieldsOnProject },
      })
      .populate('children', populatedCardFields)
      .populate('parent', populatedCardFields);
  }

  async getCardWithUnpopulatedReferences(id: string): Promise<Card> {
    return await this.findById(id);
  }

  async updateCardAndReturnWithPopulatedReferences(
    id: string,
    update: UpdateQuery<Card>,
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

    /** Aggregate query doesnt add id so adding manually */
    for (const card of cards) {
      card.id = card._id.toString();
      for (const child of card.flattenedChildren) {
        child.id = child._id.toString();
      }
    }
    return cards;
  }

  async updateManyByIds(
    ids: string[],
    update: UpdateQuery<Card>,
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

  async bundleUpdatesAndExecute(
    updates: MappedCard,
  ): Promise<mongodb.BulkWriteResult> {
    const queries = [];

    for (const [id, update] of Object.entries(updates)) {
      queries.push(this.updateOneByIdQuery(id, update));
    }

    if (queries.length === 0) return;

    const acknowledgment = await this.bulkWrite(queries);
    if (acknowledgment.hasWriteErrors()) {
      console.log(acknowledgment.getWriteErrors());
      throw new HttpException(
        'Something went wrong while updating payment info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return acknowledgment;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Card } from './model/card.model';
import { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
@Injectable()
export class CardsRepository extends BaseRepository<Card> {
  constructor(@InjectModel(Card) circleModel) {
    super(circleModel);
  }

  async getCardWithPopulatedReferences(id: string): Promise<Card> {
    return await this.findById(id).exec();
  }
  async getCardWithPopulatedReferencesBySlug(slug: string): Promise<Card> {
    return await this.findOne({ slug: slug }).exec();
  }

  async getCardWithUnpopulatedReferences(id: string): Promise<Card> {
    return await this.findById(id);
  }
}

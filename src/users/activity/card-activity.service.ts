import { Injectable } from '@nestjs/common';
import { Card } from 'src/card/model/card.model';
import { Diff } from 'src/common/interfaces';
import { Reference } from '../types/types';

@Injectable()
export class CardActivityService {
  generateCardContent(
    actionType: string,
    card: Card,
    diff: Diff<Card>,
  ): { content: string; ref: Reference } {
    switch (actionType) {
      case 'create':
        return this.createCardActivity(card);
      case 'archive':
        return this.archiveCardActivity(card);
      default:
        return null;
    }
  }

  createCardActivity(card: Card): { content: string; ref: Reference } {
    return {
      content: `created a new card ${card.title}`,
      ref: {},
    };
  }

  archiveCardActivity(card: Card): { content: string; ref: Reference } {
    return {
      content: `archived card ${card.title}`,
      ref: {},
    };
  }
}

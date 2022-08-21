import { Injectable } from '@nestjs/common';
import { Card } from 'src/card/model/card.model';
import { Diff } from 'src/common/interfaces';
import { Retro } from 'src/retro/models/retro.model';
import { Reference } from '../types/types';

@Injectable()
export class RetroActivityService {
  generateCardContent(
    actionType: string,
    retro: Retro,
    diff: Diff<Retro>,
  ): { content: string; ref: Reference } {
    switch (actionType) {
      case 'create':
        return this.createRetroActivity(retro);
      case 'archive':
        return this.archiveRetroActivity(retro);
      default:
        return null;
    }
  }

  createRetroActivity(retro: Retro): { content: string; ref: Reference } {
    return {
      content: `created a new retro period ${retro.title}`,
      ref: {},
    };
  }

  archiveRetroActivity(retro: Retro): { content: string; ref: Reference } {
    return {
      content: `archived retro period ${retro.title}`,
      ref: {},
    };
  }
}

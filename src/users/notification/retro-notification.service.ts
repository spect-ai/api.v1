import { Injectable } from '@nestjs/common';
import { Retro } from 'src/retro/models/retro.model';
import { Diff } from 'src/common/interfaces';
import { Reference } from '../types/types';

@Injectable()
export class RetroNotificationService {
  generateRetroContent(
    actionType: string,
    retro: Retro,
    diff: Diff<Retro>,
    recipient: string,
    actor: string,
  ): { content: string; ref: Reference } {
    console.log(actionType);
    switch (actionType) {
      case 'create':
        return this.createRetroNotification(retro, actor);
      case 'update':
        return this.updateRetroNotification(retro, diff, actor);
      case 'end':
        return this.endRetroNotification(retro, actor);
      default:
        return null;
    }
  }

  createRetroNotification(
    retro: Retro,
    actor: string,
  ): { content: string; ref: Reference } {
    return {
      content: `[actor] added you to retro period ${retro.title}`,
      ref: { users: { actor } },
    };
  }

  updateRetroNotification(
    retro: Retro,
    diff: Diff<Retro>,
    actor: string,
  ): { content: string; ref: Reference } {
    if (diff.updated.reward) {
      return {
        content: `[actor] updated reward for retro period ${retro.title}`,
        ref: { users: { actor } },
      };
    }
  }

  endRetroNotification(
    retro: Retro,
    actor: string,
  ): { content: string; ref: Reference } {
    return {
      content: `[actor] ended retro period ${retro.title}`,
      ref: { users: { actor } },
    };
  }
}

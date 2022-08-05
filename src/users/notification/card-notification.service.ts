import { Injectable } from '@nestjs/common';
import { Card } from 'src/card/model/card.model';
import { Diff } from 'src/common/interfaces';
import { Reference } from '../types/types';

@Injectable()
export class CardNotificationService {
  generateCardContent(
    actionType: string,
    card: Card,
    diff: Diff<Card>,
    recipient: string,
    actor: string,
  ): { content: string; ref: Reference } {
    console.log(actionType);
    switch (actionType) {
      case 'create':
        return this.createCardNotification(recipient, card, actor);
      case 'update':
        return this.updateCardNotification(recipient, card, diff, actor);
      case 'submission':
        return this.submitWorkNotification(card, actor);
      case 'revision':
        return this.reviseWorkNotification(card, actor);
      case 'feedback':
        return this.addFeedbackNotification(card, actor);
      case 'pickApplication':
        return this.pickApplicationNotification(card, actor);
      default:
        return null;
    }
  }

  createCardNotification(
    user: string,
    card: Card,
    actor: string,
  ): { content: string; ref: Reference } {
    const isAssignee = card.assignee.includes(user);
    const isReviewer = card.reviewer.includes(user);
    if (isAssignee && isReviewer) {
      return {
        content: `[actor] added you to ${card.title} as assignee and reviewer`,
        ref: { users: { actor } },
      };
    }
    if (isAssignee) {
      return {
        content: `[actor] assigned you to ${card.title}`,
        ref: { users: { actor } },
      };
    }
    if (isReviewer) {
      return {
        content: `[actor] added you to ${card.title} as reviewer`,
        ref: { users: { actor } },
      };
    }
  }

  updateCardNotification(
    user: string,
    card: Card,
    diff: Diff<Card>,
    actor: string,
  ): { content: string; ref: Reference } {
    const isNewlyAssigned = diff.added?.assignee?.includes(user);
    const isNewlyAddedAsReviewer = diff.added?.reviewer?.includes(user);
    if (isNewlyAssigned && isNewlyAddedAsReviewer) {
      return {
        content: `[actor] added you to ${card.title} as assignee and reviewer`,
        ref: { users: { actor } },
      };
    }
    if (isNewlyAssigned) {
      return {
        content: `[actor] assigned you to ${card.title}`,
        ref: { users: { actor } },
      };
    }
    if (isNewlyAddedAsReviewer) {
      return {
        content: `[actor] added you to ${card.title} as reviewer`,
        ref: { users: { actor } },
      };
    }

    const isNewlyRemovedAsAssignee = diff.deleted?.assignee?.includes(user);
    const isNewlyRemovedAsReviewer = diff.deleted?.reviewer?.includes(user);
    if (isNewlyRemovedAsAssignee && isNewlyRemovedAsReviewer) {
      return {
        content: `[actor] removed you from ${card.title} as assignee and reviewer`,
        ref: { users: { actor } },
      };
    }
    if (isNewlyRemovedAsAssignee) {
      return {
        content: `[actor] unassigned you from ${card.title}`,
        ref: { users: { actor } },
      };
    }
    if (isNewlyRemovedAsReviewer) {
      return {
        content: `[actor] removed you from ${card.title} as reviewer`,
        ref: { users: { actor } },
      };
    }
  }

  submitWorkNotification(
    card: Card,
    actor: string,
  ): { content: string; ref: Reference } {
    return {
      content: `[actor] added a new submission on ${card.title}`,
      ref: { users: { actor } },
    };
  }

  reviseWorkNotification(
    card: Card,
    actor: string,
  ): { content: string; ref: object } {
    return {
      content: `[actor] added revision instructions on ${card.title}`,
      ref: { users: { actor } },
    };
  }

  addFeedbackNotification(
    card: Card,
    actor: string,
  ): { content: string; ref: object } {
    return {
      content: `[actor] added feedback on ${card.title}`,
      ref: { users: { actor } },
    };
  }

  pickApplicationNotification(
    card: Card,
    actor: string,
  ): { content: string; ref: object } {
    return {
      content: `[actor] picked your application on ${card.title}`,
      ref: { users: { actor } },
    };
  }
}

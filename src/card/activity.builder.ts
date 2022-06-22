import { Injectable } from '@nestjs/common';
import { diff } from 'fast-array-diff';
import { CreateCardRequestDto } from 'src/card/dto/create-card-request.dto';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import {
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from 'src/card/dto/work-request.dto';
import { Card } from 'src/card/model/card.model';
import { Project } from 'src/project/model/project.model';
import { RequestProvider } from 'src/users/user.provider';
import { v4 as uuidv4 } from 'uuid';
import { Activity } from '../common/types/activity.type';

@Injectable()
export class ActivityBuilder {
  commitId: string;
  constructor(private readonly requestProvider: RequestProvider) {
    this.commitId = uuidv4();
  }

  resolveArrayTypeActivityContent(
    added: any[],
    removed: any[],
    fieldName: string,
  ) {
    let res = '';
    if (added.length > 1) res += `added ${fieldName}`;
    else if (added.length > 0) res += `added ${fieldName}s`;
    res += `${added.join(', ')}`;

    if (added.length > 0 && removed.length > 0) res += ` and removed `;
    else if (added.length === 0 && removed.length === 1)
      res += `removed ${fieldName}`;
    else if (added.length === 0 && removed.length >= 1)
      res += `removed ${fieldName}s`;

    res += `${removed.join(', ')}`;

    return res;
  }

  buildNewCardActivity(req: CreateCardRequestDto): Activity {
    const newCardActivity = {} as Activity;

    newCardActivity.content = `created card ${req.title}`;
    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = this.requestProvider.user.id;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    return newCardActivity;
  }

  buildUpdatedCardActivity(req: UpdateCardRequestDto, card: Card): Activity[] {
    const timestamp = new Date();
    const contentArray = [];
    if (req.reviewer)
      contentArray.push(this.buildUpdatedReviewerActivityContent(req, card));

    const newActivities = [];
    for (const content of contentArray) {
      if (content)
        newActivities.push({
          content,
          timestamp,
          actorId: this.requestProvider.user.id,
          commitId: this.commitId,
          comment: false,
        });
    }

    return newActivities;
  }

  buildUpdatedReviewerActivityContent(req: UpdateCardRequestDto, card: Card) {
    const difference = diff(req.reviewer, card.reviewer);
    if (difference.added?.length > 0 || difference.removed?.length > 0) {
      return this.resolveArrayTypeActivityContent(
        difference.added,
        difference.removed,
        'reviewer',
      );
    }
  }

  buildUpdatedAssigneeActivityContent(req: UpdateCardRequestDto, card: Card) {
    const difference = diff(req.assignee, card.assignee);

    return this.resolveArrayTypeActivityContent(
      difference.added,
      difference.removed,
      'assignee',
    );
  }

  buildUpdatedDeadlineActivityContent(req: UpdateCardRequestDto, card: Card) {
    if (card.deadline !== req.deadline) {
      if (!req.deadline) {
        return 'removed deadline';
      }
      return `updated deadline to ${req.deadline}`;
    }
  }

  buildUpdatedLabelsActivityContent(req: UpdateCardRequestDto, card: Card) {
    const difference = diff(req.assignee, card.assignee);

    return this.resolveArrayTypeActivityContent(
      difference.added,
      difference.removed,
      'label',
    );
  }

  buildUpdatedRewardActivity(req: UpdateCardRequestDto, card: Card) {
    if (req.reward.value !== card.reward.value) {
      return `updated value to ${req.reward.value} ${req.reward.token.symbol} on ${req.reward.chain.name}`;
    }
  }

  buildUpdatedCardTypeActivity(req: UpdateCardRequestDto, card: Card) {
    if (req.type !== card.type) {
      return `updated card type to ${req.type}`;
    }
  }

  buildUpdatedColumnActivity(
    req: UpdateCardRequestDto,
    card: Card,
    project: Project,
  ) {
    if (req.columnId !== card.columnId) {
      return `updated column to ${project.columnDetails[req.columnId].name}`;
    }
  }

  buildUpdatedStatusActivity(req: UpdateCardRequestDto, card: Card) {
    return ``;
  }

  buildCreatedWorkThreadActivity(req: CreateWorkThreadRequestDto, card: Card) {
    return `created a work thread ${req.name}`;
  }

  buildUpdatedWorkThreadActivity(req: UpdateWorkThreadRequestDto, card: Card) {
    return `updated work thread to`;
  }

  buildCreatedWorkUnitActivity(req: CreateWorkUnitRequestDto, card: Card) {
    return `created a work unit`;
  }

  buildUpdatedWorkUnitActivity(req: UpdateWorkUnitRequestDto, card: Card) {
    return `updated work unit`;
  }
}

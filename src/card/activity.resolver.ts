import { Injectable } from '@nestjs/common';
import { diff } from 'fast-array-diff';
import { Activity } from 'src/common/types/activity.type';
import { Project } from 'src/project/model/project.model';
import { UsersService } from 'src/users/users.service';
import { Card } from './model/card.model';

const activityIdToFieldMap = {
  updateDeadline: 'deadline',
  updateReviewer: 'reviewer',
  updateAssignee: 'assignee',
  updateReward: 'reward',
  updateLabels: 'labels',
  updatePriority: 'priority',
  updateCardType: 'type',
  updateColumn: 'columnId',
  updateStatus: 'status',
};

@Injectable()
export class ActivityResolver {
  constructor(private readonly userService: UsersService) {}

  async resolveActivities(card: Card) {
    console.log(card.activity);
    for (const activity of card.activity) {
      console.log(activity);
      if (activity.activityId === 'createCard') {
        activity.content = this.resolveCreateCard(activity);
      } else if (['updateLabels'].includes(activity.activityId)) {
        activity.content = this.resolveUpdateArrayFields(
          activity,
          activityIdToFieldMap[activity.activityId],
        );
      } else if (
        ['updateAssignee', 'updateReviewer'].includes(activity.activityId)
      ) {
        activity.content = await this.resolveUpdateMemberFields(
          activity,
          activityIdToFieldMap[activity.activityId],
        );
      } else if (
        [
          'updatePriority',
          'updateCardType',
          'updateDeadline',
          'updateColumn',
        ].includes(activity.activityId)
      ) {
        activity.content = this.resolveUpdatedFields(
          activity,
          activityIdToFieldMap[activity.activityId],
        );
      } else if (['updateReward'].includes(activity.activityId)) {
        activity.content = this.resolveUpdatedReward(activity);
      } else if (['updateStatus'].includes(activity.activityId)) {
        activity.content = this.resolveUpdatedStatus(activity);
      }
    }

    return card;
  }

  private resolveCreateCard(activity: Activity) {
    return `created ${activity.changeLog?.next?.type} ${activity.changeLog?.next?.title}`;
  }

  resolveArrayTypeActivityContent(
    added: any[],
    removed: any[],
    fieldName: string,
  ) {
    let res = '';
    if (added.length > 1) res += `added ${fieldName}s `;
    else if (added.length === 1) res += `added ${fieldName} `;
    res += `${added.join(', ')}`;

    if (added.length > 0 && removed.length > 0) res += ` and removed `;
    else if (added.length === 0 && removed.length > 1)
      res += `removed ${fieldName}s`;
    else if (added.length === 0 && removed.length === 1)
      res += `removed ${fieldName}`;

    res += `${removed.join(', ')}`;

    return res;
  }

  private resolveUpdatedFields(activity: Activity, field: string) {
    return `updated ${field} from ${activity.changeLog?.prev[field]} to ${activity.changeLog?.next[field]}`;
  }

  private resolveUpdateArrayFields(activity: Activity, field: string) {
    try {
      const difference = diff(
        activity.changeLog?.next[field],
        activity.changeLog?.prev[field],
      );
      return this.resolveArrayTypeActivityContent(
        difference.added,
        difference.removed,
        field,
      );
    } catch (error) {
      console.log(error);
      return `updated ${field}`;
    }
  }

  private async resolveUpdateMemberFields(activity: Activity, field: string) {
    try {
      const difference = diff(
        activity.changeLog?.next[field],
        activity.changeLog?.prev[field],
      );
      const addedUsers = await this.userService.getPublicProfileOfMultipleUsers(
        difference.added as string[],
      );
      const addedUsernames = addedUsers.map((a) => a.username);
      const removedUsers =
        await this.userService.getPublicProfileOfMultipleUsers(
          difference.removed as string[],
        );
      const removedUsernames = removedUsers.map((a) => a.username);

      return this.resolveArrayTypeActivityContent(
        addedUsernames,
        removedUsernames,
        field,
      );
    } catch (error) {
      console.log(error);
      return `updated ${field}`;
    }
  }

  private resolveUpdatedReward(activity: Activity) {
    if (activity.changeLog?.next.reward?.value > 0) {
      return `updated reward to ${activity.changeLog?.next.reward?.value} ${activity.changeLog?.next.reward?.token.symbol} on ${activity.changeLog?.next.reward?.chain.name}`;
    } else if (activity.changeLog?.next.reward?.value === 0) {
      `removed reward amount`;
    }
  }

  private resolveUpdatedStatus(activity: Activity) {
    const statusChanges = [];
    if (
      activity.changeLog?.next.status.active !==
      activity.changeLog?.prev.status.active
    ) {
      if (activity.changeLog?.next.status.active) statusChanges.push('Opened');
      else statusChanges.push('Closed');
    }
    if (
      activity.changeLog?.next.status.paid !==
      activity.changeLog?.prev.status.paid
    ) {
      if (activity.changeLog?.next.status.paid) statusChanges.push('Paid');
    }
    if (
      activity.changeLog?.next.status.archived !==
      activity.changeLog?.prev.status.archived
    ) {
      if (activity.changeLog?.next.status.archived)
        statusChanges.push('Archived');
    }
    return `updated status to ${statusChanges.join(', ')}`;
  }
}

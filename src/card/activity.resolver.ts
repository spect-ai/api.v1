import { Injectable } from '@nestjs/common';
import { diff } from 'fast-array-diff';
import { Activity } from 'src/common/types/activity.type';
import { Project } from 'src/project/model/project.model';
import { UsersService } from 'src/users/users.service';
import { Card } from './model/card.model';
import moment from 'moment';

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

const activityIdToFieldNameMap = {
  updateDeadline: 'deadline',
  updateReviewer: 'reviewer',
  updateAssignee: 'assignee',
  updateReward: 'reward',
  updateLabels: 'label',
  updatePriority: 'priority',
  updateCardType: 'type',
  updateColumn: 'columnId',
  updateStatus: 'status',
};

const priorityMap = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
};

@Injectable()
export class ActivityResolver {
  constructor(private readonly userService: UsersService) {}

  async resolveActivities(card: Card) {
    for (const activity of card.activity) {
      if (activity.activityId === 'createCard') {
        activity.content = this.resolveCreateCard(activity);
      } else if (['updateLabels'].includes(activity.activityId)) {
        activity.content = this.resolveUpdateArrayFields(
          activity,
          activityIdToFieldMap[activity.activityId],
          activityIdToFieldNameMap[activity.activityId],
        );
      } else if (
        ['updateAssignee', 'updateReviewer'].includes(activity.activityId)
      ) {
        activity.content = await this.resolveUpdateMemberFields(
          activity,
          activityIdToFieldMap[activity.activityId],
          activityIdToFieldNameMap[activity.activityId],
        );
      } else if (
        ['updateCardType', 'updateColumn'].includes(activity.activityId)
      ) {
        activity.content = this.resolveUpdatedFields(
          activity,
          activityIdToFieldMap[activity.activityId],
          activityIdToFieldNameMap[activity.activityId],
        );
      } else if (['updateDeadline'].includes(activity.activityId)) {
        activity.content = this.resolveDateFields(
          activity,
          activityIdToFieldMap[activity.activityId],
          activityIdToFieldNameMap[activity.activityId],
        );
      } else if (['updateReward'].includes(activity.activityId)) {
        activity.content = this.resolveUpdatedReward(activity);
      } else if (['updateStatus'].includes(activity.activityId)) {
        activity.content = this.resolveUpdatedStatus(activity);
      } else if (['updatePriority'].includes(activity.activityId)) {
        activity.content = this.resolveUpdatedMappedFields(
          activity,
          activityIdToFieldMap[activity.activityId],
          activityIdToFieldNameMap[activity.activityId],
          priorityMap,
        );
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
      res += `removed ${fieldName}s `;
    else if (added.length === 0 && removed.length === 1)
      res += `removed ${fieldName} `;

    res += `${removed.join(', ')}`;

    return res;
  }

  private resolveUpdatedFields(
    activity: Activity,
    fieldKey: string,
    fieldName: string,
  ) {
    try {
      if (
        activity.changeLog?.prev[fieldKey] &&
        activity.changeLog?.next[fieldKey]
      )
        return `updated ${fieldName} from ${activity.changeLog?.prev[fieldKey]} to ${activity.changeLog?.next[fieldKey]}`;
      else if (activity.changeLog?.prev[fieldKey])
        return `removed ${fieldName}`;
      else if (activity.changeLog?.next[fieldKey])
        return `added ${fieldName} activity.changeLog?.next[fieldKey]`;
    } catch (error) {
      console.log(error);
      return `updated ${fieldName}`;
    }
  }

  private resolveDateFields(
    activity: Activity,
    fieldKey: string,
    fieldName: string,
  ) {
    try {
      if (
        activity.changeLog?.prev[fieldKey] &&
        activity.changeLog?.next[fieldKey]
      ) {
        const prevDate = activity.changeLog?.prev[fieldKey];
        const nextDate = activity.changeLog?.next[fieldKey];

        return `updated ${fieldName} from ${
          prevDate.slice(0, -1).split('T')[0]
        } to ${nextDate.slice(0, -1).split('T')[0]}`;
      } else if (activity.changeLog?.prev[fieldKey])
        return `removed ${fieldName}`;
      else if (activity.changeLog?.next[fieldKey]) {
        const nextDate = activity.changeLog?.next[fieldKey];
        return `added ${fieldName} ${nextDate.slice(0, -1).split('T')[0]}`;
      }
    } catch (error) {
      console.log(error);
      return `updated ${fieldName}`;
    }
  }

  private resolveUpdateArrayFields(
    activity: Activity,
    fieldKey: string,
    fieldName: string,
  ) {
    try {
      const difference = diff(
        activity.changeLog?.prev[fieldKey],
        activity.changeLog?.next[fieldKey],
      );
      return this.resolveArrayTypeActivityContent(
        difference.added,
        difference.removed,
        fieldName,
      );
    } catch (error) {
      console.log(error);
      return `updated ${fieldName}`;
    }
  }

  private async resolveUpdateMemberFields(
    activity: Activity,
    fieldKey: string,
    fieldName: string,
  ) {
    try {
      const difference = diff(
        activity.changeLog?.prev[fieldKey],
        activity.changeLog?.next[fieldKey],
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
        fieldName,
      );
    } catch (error) {
      console.log(error);
      return `updated ${fieldName}`;
    }
  }

  private resolveUpdatedReward(activity: Activity) {
    if (activity.changeLog?.next.reward?.value > 0) {
      return `updated reward to ${activity.changeLog?.next.reward?.value} ${activity.changeLog?.next.reward?.token.symbol} on ${activity.changeLog?.next.reward?.chain.name}`;
    } else if (activity.changeLog?.next.reward?.value === 0) {
      return `removed reward amount`;
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

  private resolveUpdatedMappedFields(
    activity: Activity,
    fieldKey: string,
    fieldName: string,
    map: object,
  ) {
    try {
      if (
        !activity.changeLog?.prev[fieldKey] &&
        activity.changeLog?.next[fieldKey]
      ) {
        return `updated ${fieldName} to ${
          map[activity.changeLog?.next[fieldKey]]
        }`;
      } else if (
        activity.changeLog?.prev[fieldKey] &&
        !activity.changeLog?.next[fieldKey]
      ) {
        return `removed ${fieldName}`;
      } else
        return `updated ${fieldName} from ${
          map[activity.changeLog?.prev[fieldKey]]
        } to ${map[activity.changeLog?.next[fieldKey]]}`;
    } catch (error) {
      console.log(error);
      return `updated ${fieldName}`;
    }
  }
}

import { Injectable } from '@nestjs/common';
import { diff as objectDiff } from 'deep-object-diff';
import { diff as arrayDiff } from 'fast-array-diff';
import { CreateCardRequestDto } from 'src/card/dto/create-card-request.dto';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import {
  CreateWorkThreadRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from 'src/card/dto/work-request.dto';
import { Card } from 'src/card/model/card.model';
import { CommonTools } from 'src/common/common.service';
import { Project } from 'src/project/model/project.model';
import { v4 as uuidv4 } from 'uuid';
import { Activity } from '../../common/types/activity.type';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from '../dto/application.dto';

const fieldUpdateToActiityIdMap = {
  deadline: 'updateDeadline',
  reviewer: 'updateReviewer',
  assignee: 'updateAssignee',
  reward: 'updateReward',
  labels: 'updateLabels',
  priority: 'updatePriority',
  type: 'updateCardType',
  columnId: 'updateColumn',
  status: 'updateStatus',
};

@Injectable()
export class ActivityBuilder {
  commitId: string;
  constructor(private readonly commonTools: CommonTools) {
    this.commitId = uuidv4();
  }

  buildNewCardActivity(caller: string, req: CreateCardRequestDto): Activity {
    const newCardActivity = {} as Activity;

    newCardActivity.activityId = `createCard`;
    newCardActivity.changeLog = {
      prev: {},
      next: req,
    };
    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = caller;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    return newCardActivity;
  }

  buildUpdatedCardActivity(
    caller: string,
    req: UpdateCardRequestDto,
    card: Card,
    project?: Project,
  ): Activity[] {
    const timestamp = new Date();
    const newActivities = [];
    for (const [field, value] of Object.entries(req)) {
      if (
        fieldUpdateToActiityIdMap.hasOwnProperty(field) &&
        this.valueIsDifferent(req, card, field)
      ) {
        let changeLog;
        if (field === 'columnId') {
          changeLog = this.buildColumnUpdateChange(req, card, field, project);
        } else changeLog = this.buildUpdateChangeLog(req, card, field);
        newActivities.push({
          activityId: fieldUpdateToActiityIdMap[field],
          changeLog: changeLog,
          timestamp,
          actorId: caller,
          commitId: this.commitId,
          comment: false,
        });
      }
    }

    return newActivities;
  }

  private buildUpdateChangeLog(
    req: UpdateCardRequestDto,
    card: Card,
    field: string,
  ) {
    return {
      prev: {
        [field]: card[field],
      },
      next: {
        [field]: req[field],
      },
    };
  }

  private buildColumnUpdateChange(
    req: UpdateCardRequestDto,
    card: Card,
    field: string,
    project: Project,
  ) {
    return {
      prev: {
        [field]: project.columnDetails[card[field]].name,
      },
      next: {
        [field]: project.columnDetails[req[field]].name,
      },
    };
  }

  valueIsDifferent(req: UpdateCardRequestDto, card: Card, field: string) {
    if (['deadline', 'priority', 'type', 'columnId'].includes(field)) {
      return card[field] !== req[field];
    } else if (['assignee', 'reviewer', 'labels'].includes(field)) {
      const difference = arrayDiff(card[field], req[field]);
      return difference.added?.length !== 0 || difference.removed?.length !== 0;
    } else if (['status'].includes(field)) {
      const difference = objectDiff(card[field], req[field]);
      return Object.keys(difference)?.length > 0;
    } else if (['reward'].includes(field)) {
      const difference = objectDiff(card[field], req[field]);

      return (
        Object.keys(difference).includes('value') ||
        ((Object.keys(difference).includes('chain') ||
          Object.keys(difference).includes('token')) &&
          card[field].value > 0)
      );
    } else return false;
  }

  buildApplicationActivity(
    caller: string,

    card: Card,
    type: 'create' | 'update' | 'delete',
    req?: CreateApplicationDto | UpdateApplicationDto,
    applicationId?: string,
  ): Activity {
    const newCardActivity = {} as Activity;

    if (type === 'create') {
      newCardActivity.activityId = `createApplication`;
      newCardActivity.changeLog = {
        prev: {},
        next: {
          application: req,
        },
      };
    } else if (type === 'delete') {
      newCardActivity.activityId = `deleteApplication`;
      newCardActivity.changeLog = {
        prev: { application: card.application[applicationId] },
        next: {},
      };
    } else if (type === 'update') {
      /** Find the difference to see if activity needs to be saved */
      const isDifferent = {};
      const existingApplication = card.application[applicationId];
      isDifferent['content'] =
        req.content && existingApplication.content !== req.content;
      isDifferent['title'] =
        req.title && existingApplication.title !== req.title;
      /** If there is no difference return */
      if (!Object.values(isDifferent).includes(true)) return;

      newCardActivity.activityId = `updateApplication`;
      newCardActivity.changeLog = {
        prev: { application: {} },
        next: { application: {} },
      };

      /** Store the difference in title or content in the application.
       * Only store content if there is a change to reduce storage usage
       * */
      newCardActivity.changeLog.prev.application = {
        ...newCardActivity.changeLog.prev.application,
        title: existingApplication.title,
      };
      newCardActivity.changeLog.next.application = {
        ...newCardActivity.changeLog.next.application,
        title: req.title,
      };

      if (isDifferent['content']) {
        newCardActivity.changeLog.prev.application = {
          ...newCardActivity.changeLog.prev.application,
          content: existingApplication.content,
        };
        newCardActivity.changeLog.next.application = {
          ...newCardActivity.changeLog.next.application,
          content: req.content,
        };
      }
    }

    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = caller;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    return newCardActivity;
  }

  buildPickApplicationUpdate(caller: string, card: Card, applicants: string[]) {
    const newCardActivity = {} as Activity;
    const difference = arrayDiff(card.assignee, applicants);
    if (difference.added.length === 0 && difference.removed.length === 0)
      return;

    newCardActivity.activityId = `pickApplication`;

    newCardActivity.changeLog = {
      prev: {
        assignee: card.assignee,
      },
      next: {
        assignee: applicants,
      },
    };

    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = caller;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    return newCardActivity;
  }

  buildNewWorkThreadActivity(caller: string, req: CreateWorkThreadRequestDto) {
    const newCardActivity = {} as Activity;
    newCardActivity.activityId = `createWorkThread`;

    if (req.status !== 'inReview') return;

    newCardActivity.changeLog = {
      prev: {},
      next: {
        work: req,
      },
    };

    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = caller;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    return newCardActivity;
  }

  buildCreateWorkActivity(
    caller: string,
    activityId: 'createWorkThread' | 'createWorkUnit',
    threadName: string,
    content?: string,
    type?: string,
    threadStatus?: 'inReview' | 'draft' | 'accepted' | 'inRevision',
  ) {
    const newCardActivity = {} as Activity;
    newCardActivity.activityId = activityId;

    newCardActivity.changeLog = {
      prev: {},
      next: {
        work: {
          threadName,
          content,
          type,
          threadStatus,
        },
      },
    };

    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = caller;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    return newCardActivity;
  }

  buildUpdateWorkThreadActivity(
    caller: string,

    card: Card,
    threadId: string,
    req: UpdateWorkThreadRequestDto,
  ) {
    const newCardActivity = {} as Activity;
    newCardActivity.activityId = 'updateWorkThread';

    newCardActivity.changeLog = {
      prev: {},
      next: {
        work: {
          threadName: req.name,
          threadStatus: req.status,
        },
      },
    };

    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = caller;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    return newCardActivity;
  }

  buildUpdateWorkUnitActivity(
    caller: string,

    card: Card,
    threadId: string,
    workUnitId: string,
    req: UpdateWorkUnitRequestDto,
  ) {
    const newCardActivity = {} as Activity;
    newCardActivity.activityId = 'updateWorkUnit';

    newCardActivity.changeLog = {
      prev: {
        work: {
          threadName: card.workThreads[threadId].name,
          content: card.workThreads[threadId].workUnits[workUnitId].content,
          type: card.workThreads[threadId].workUnits[workUnitId].type,
          threadStatus: card.workThreads[threadId].status,
        },
      },
      next: {
        work: {
          threadName: card.workThreads[threadId].name,
          content: req.content,
          type: req.type,
          threadStatus: req.status
            ? req.status
            : card.workThreads[threadId].status,
        },
      },
    };

    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = caller;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    return newCardActivity;
  }
}

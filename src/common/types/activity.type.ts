import { Payment } from '../models/payment.model';
import { Status } from './status.type';

export type MinimalApplicationUnit = {
  title?: string;
  content?: string;
};

export type MinimalWorkActivity = {
  threadName?: string;
  threadStatus?: 'inReview' | 'draft' | 'accepted' | 'inRevision';
  content?: string;
  type?: string;
};

export type ChangeField = {
  title?: string;
  reviewer?: string[];
  assignee?: string[];
  reward?: Payment;
  labels?: string[];
  deadline?: string;
  column?: string;
  priority?: number;
  type?: string;
  status?: Status;
  application?: MinimalApplicationUnit;
  work?: MinimalWorkActivity;
};

export type ChangeLog = {
  prev: ChangeField;
  next: ChangeField;
};

export type Activity = {
  /**
   * The activity id
   */
  activityId:
    | 'createCard'
    | 'updateDeadline'
    | 'updateReviewer'
    | 'updateAssignee'
    | 'updateReward'
    | 'updateLabels'
    | 'updatePriority'
    | 'updateCardType'
    | 'updateColumn'
    | 'createWorkThread'
    | 'updateWorkThread'
    | 'createWorkUnit'
    | 'updateWorkUnit'
    | 'createApplication'
    | 'updateApplication'
    | 'deleteApplication'
    | 'pickApplication';

  /**
   * The commit id of the update of the activity, it is used to group updates that took place at the same time
   */
  commitId: string;

  /**
   * The id of the person who performed the activity
   */
  actorId: string;

  /**
   * The change in card field after this activity
   */
  changeLog: ChangeLog;

  /**
   * The description / content of the activity
   */
  content: string;

  /**
   * The timestamp of the activity
   */
  timestamp: Date;

  /**
   * The timestamp of the activity
   */
  comment: boolean;
};

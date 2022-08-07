import { Status } from 'src/common/types/status.type';

export type Automation = {
  id: string;
  name: string;
  trigger: Trigger;
  conditions: Condition[];
  actions: Action[];
};

export type PossibleTriggerIds =
  | 'statusChange'
  | 'columnChange'
  | 'priorityChange'
  | 'deadlineChange'
  | 'assigneeChange'
  | 'reviewerChange'
  | 'labelChange'
  | 'typeChange'
  | 'cardCreate'
  | 'cardArchive'
  | 'cardUnarchive'
  | 'allSubCardsClose'
  | 'immediateSubCardsClose';

export type Trigger = {
  uuid: string;
  id: PossibleTriggerIds;
  name: string;
  item:
    | StatusChangeTrigger
    | MemberChangeTrigger
    | DeadlineChangeTrigger
    | BasicTrigger;
};

export const triggerIdToName = {
  statusChange: 'Status Changes',
  columnChange: 'Column Changes',
  priorityChange: 'Priority Changes',
  deadlineChange: 'Deadline Changes',
  assigneeChange: 'Assignee Changes',
  reviewerChange: 'Reviewer Changes',
  labelChange: 'Label Changes',
  typeChange: 'Type Changes',
  cardCreate: 'Card Created',
  cardArchive: 'Card Archived',
  cardUnarchive: 'Card Unarchived',
  allSubCardsClose: 'All Subcards Closed',
  immediateSubCardsClose: 'Immediate Subcards Closed',
};

export type StatusChangeTrigger = {
  from: Status;
  to: Status;
};

export type MemberChangeTrigger = {
  from?: string[];
  to?: string[];
  fromNotEmptyToEmpty?: boolean;
  fromEmptytoNotEmpty?: boolean;
  countReducedFrom?: number;
  countIncreasedFrom?: number;
};

export type BasicTrigger = {
  from?: string;
  to?: string;
};

export type DeadlineChangeTrigger = {
  before?: string;
  after?: string;
  between?: string[];
};

export type ConditionIds =
  | 'status'
  | 'column'
  | 'assignee'
  | 'reviewer'
  | 'label'
  | 'type'
  | 'priority'
  | 'deadline';

export type Condition = {
  id: ConditionIds;
  name: string;
};

export type PossibleActionIds =
  | 'changeStatus'
  | 'changeColumn'
  | 'changePriority'
  | 'changeDeadline'
  | 'changeAssignee'
  | 'changeReviewer'
  | 'changeLabels'
  | 'changeType'
  | 'archive'
  | 'unarchive'
  | 'close'
  | 'open'
  | 'createSubCard'
  | 'archiveAllSubCards'
  | 'archiveImmediateSubCards'
  | 'unarchiveAllSubCards'
  | 'unarchiveImmediateSubCards'
  | 'closeAllSubCards'
  | 'closeImmediateSubCards'
  | 'openAllSubCards'
  | 'openImmediateSubCards'
  | 'callWebhook'
  | 'closeParentCard'
  | 'openParentCard'
  | 'closeOtherCardsOnTheSameLevel'
  | 'openOtherCardsOnTheSameLevel';

export const actionIdToName = {
  changeStatus: 'Change Status',
  changeColumn: 'Change Column',
  changePriority: 'Change Priority',
  changeDeadline: 'Change Deadline',
  changeAssignee: 'Change Assignee',
  changeReviewer: 'Change Reviewer',
  changeLabels: 'Change Labels',
  changeType: 'Change Type',
  archive: 'Archive',
  unarchive: 'Unarchive',
  close: 'Close',
  open: 'Open',
  createSubCard: 'Create Subcard',
  archiveAllSubCards: 'Archive All Subcards',
  archiveImmediateSubCards: 'Archive Immediate Subcards',
  unarchiveAllSubCards: 'Unarchive All Subcards',
  unarchiveImmediateSubCards: 'Unarchive Immediate Subcards',
  closeAllSubCards: 'Close All Subcards',
  closeImmediateSubCards: 'Close Immediate Subcards',
  openAllSubCards: 'Open All Subcards',
  openImmediateSubCards: 'Open Immediate Subcards',
  callWebhook: 'Call Webhook',
  closeParentCard: 'Close Parent Card',
  openParentCard: 'Open Parent Card',
  closeOtherCardsOnTheSameLevel: 'Close Other Cards on the Same Level',
  openOtherCardsOnTheSameLevel: 'Open Other Cards on the Same Level',
};

export type Action = {
  id: PossibleActionIds;
  name: string;
  action?:
    | ChangeStatusAction
    | ChangeMemberAction
    | ChangeLabelAction
    | ChangeSimpleFieldAction;
};

export type ChangeStatusAction = {
  to: Status;
};

export type ChangeMemberAction = {
  add?: string[];
  remove?: string[];
  clear?: boolean;
};

export type ChangeLabelAction = {
  add?: string[];
  remove?: string[];
  clear?: boolean;
};

export type ChangeSimpleFieldAction = {
  to: string;
};

export type OldTriggerValue = {
  from?: boolean;
  to?: boolean;
  added?: string[];
  removed?: string[];
  cleared?: boolean;
};

export type OldConditionValue = {
  has?: string;
  is?: string;
  hasNot?: string;
  isNot?: string;
  isEmpty?: boolean;
  isNotEmpty?: boolean;
};

export type OldActionValue = {
  to?: any;
  add?: any[] | any;
  remove?: any[];
  clear?: boolean;
};

export type OldCondition = {
  property: string;
  value: OldConditionValue;
};

export type OldAction = {
  property: string;
  value: OldActionValue;
};

export type OldAutomation = {
  name: string;
  triggerProperty: string;
  value: OldTriggerValue;
  conditions: OldCondition[];
  actions: OldAction[];
};

import { Circle } from 'src/circle/model/circle.model';
import { Collection } from 'src/collection/model/collection.model';
import { MappedItem, MappedPartialItem } from 'src/common/interfaces';
import { Status } from 'src/common/types/status.type';
import { User } from 'src/users/model/users.model';

export type DataContainer = {
  collection?: MappedItem<Collection>;
  circle?: MappedItem<Circle>;
};

export type AutomationUpdatesContainer = {
  collection?: MappedItem<Partial<Collection>>;
  circle?: MappedItem<Partial<Circle>>;
  user?: MappedItem<Partial<User>>;
};

export type Automation = {
  id: string;
  name: string;
  trigger: Trigger;
  conditions: Condition[];
  actions: Action[];
};

export type CardTriggerId =
  | 'statusChange'
  | 'columnChange'
  | 'priorityChange'
  | 'deadlineChange'
  | 'startDateChange'
  | 'assigneeChange'
  | 'reviewerChange'
  | 'labelChange'
  | 'typeChange'
  | 'cardCreate'
  | 'cardArchive'
  | 'cardUnarchive'
  | 'submission'
  | 'revisionInstructions'
  | 'close';

export type ProjectTriggerId =
  | 'projectCreate'
  | 'columnPositionUpdate'
  | 'columnCreate'
  | 'columnDelete';

export type Trigger = CardTrigger | ProjectTrigger;

export type CardTrigger = {
  uuid: string;
  id: CardTriggerId;
  name: string;
  item:
    | StatusChangeTrigger
    | MemberChangeTrigger
    | DeadlineChangeTrigger
    | StartDateChangeTrigger
    | BasicTrigger
    | RevisionInstructionsTrigger
    | CardCreateTrigger;
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

export type StartDateChangeTrigger = {
  before?: string;
  after?: string;
  between?: string[];
};

export type CardCreateTrigger = {
  projectId: string;
  columnId?: string;
  isParent?: boolean;
};
// eslint-disable-next-line @typescript-eslint/ban-types
export type RevisionInstructionsTrigger = {};

export type ProjectTrigger = {
  uuid: string;
  id: ProjectTriggerId;
  name: string;
  item: BasicTrigger;
};

export type ProjectCreateTrigger = {
  parents: string[];
};

export type ColumnCreateTrigger = {
  projectId: string;
};

export type ColumnDeleteTrigger = {
  projectId: string;
  columnId?: string;
};

export type ColumnPositionUpdateTrigger = {
  from?: number;
  to?: number;
};

export type ConditionId =
  | 'checkStatus'
  | 'checkColumn'
  | 'checkPriority'
  | 'checkDeadline'
  | 'checkStartDate'
  | 'checkAssignee'
  | 'checkReviewer'
  | 'checkLabel'
  | 'checkType'
  | 'checkParent'
  | 'checkSubCards'
  | 'checkImmediateSubCards'
  | 'checkCardsOnSameLevel';

export type Condition = {
  id: ConditionId;
  name: string;
  item:
    | BasicCondition
    | DeadlineCondition
    | StartDateCondition
    | MemberCondition
    | StatusCondition
    | CheckCardsOnSameLevelCondition;
};

export type BasicCondition = {
  isEmpty?: boolean;
  is?: string;
};

export type DeadlineCondition = {
  isEmpty?: boolean;
  is?: string;
  isAfter?: string;
  isBefore?: string;
  isBetween?: string[];
};

export type StartDateCondition = {
  isEmpty?: boolean;
  is?: string;
  isAfter?: string;
  isBefore?: string;
  isBetween?: string[];
};

export type MemberCondition = {
  isEmpty?: boolean;
  is?: string[];
  has?: string[];
  doesNotHave?: string[];
  hasCount?: number;
  hasCountLessThan?: number;
  hasCountGreaterThan?: number;
};

export type StatusCondition = {
  is: Status;
};

export type SubmissionCondition = {
  atLeastOneStatus?: string;
  allHaveStatus?: string;
  noneHaveStatus?: string;
};

export type CheckCardsOnSameLevelCondition = {
  status?: Status;
};

export type ActionId =
  | 'changeStatus'
  | 'changeColumn'
  | 'changePriority'
  | 'changeDeadline'
  | 'changeStartDate'
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
  | 'openOtherCardsOnTheSameLevel'
  | 'createCard'
  | 'createMultipleCards'
  | 'createColumn'
  | 'removeColumn'
  | 'createProject'
  | 'createCircle';

export type Action = {
  id: ActionId;
  name: string;
  item?:
    | ChangeStatusAction
    | ChangeMemberAction
    | ChangeLabelAction
    | ChangeSimpleFieldAction
    | CloseCardAction;
};

export type ChangeStatusAction = {
  to: Status;
};

export type ChangeMemberAction = {
  set?: string[];
  add?: string[];
  remove?: string[];
  clear?: boolean;
  setToCaller?: boolean;
  addCaller?: boolean;
  removeCaller?: boolean;
};

export type ChangeLabelAction = {
  set?: string[];
  add?: string[];
  remove?: string[];
  clear?: boolean;
};

export type ChangeSimpleFieldAction = {
  to: string | number | boolean | 'Task' | 'Bounty';
};

export type CreateCardAction = {
  projectId: string;
  fromCardId: string;
  columnId?: string;
};

export type CloseCardAction = {
  onlyImmmediateSubCards?: boolean;
  allSubCards?: boolean;
};

export type CloseParentCardAction = {
  cascade?: boolean;
};

export type CreateMultipleCardsAction = {
  projectId: string;
  columnId?: string;
  fromCardIds?: string[];
  fromImmediateSubCardsOf?: string;
  fromSubCardsOf?: string;
};

export type CreateColumnAction = {
  projectId: string;
  nameFromTriggerCard?: boolean;
  positionFromTriggerCard?: boolean;
  referenceToTriggerCard?: boolean;
  name?: string;
  position?: number;
  reference?: string;
};

export type RemoveColumnAction = {
  projectId: string;
  columnId?: string;
  positionIdx?: number;
  columnIdFromTriggerCard?: boolean;
  relatedColumnIdFromTriggerCard?: boolean;
};

export type CreateProjectAction = {
  circleId: string;
  fromTemplateId: string;
};

export type CreateCircleAction = {
  parents?: string[];
  nameFromTriggerCard?: boolean;
  referenceToTriggerCard?: boolean;
  name?: string;
  fromTemplateId?: string;
  withProjectsFromTemplateIds?: string[];
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

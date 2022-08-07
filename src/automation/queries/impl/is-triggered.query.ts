import { Trigger } from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';

export class IsStatusChangeTriggeredQuery {
  constructor(
    public readonly card: Card,
    public readonly update: Partial<Card>,
    public readonly trigger: Trigger,
  ) {}
}

export class IsMemberChangeTriggeredQuery {
  constructor(
    public readonly card: Card,
    public readonly update: Partial<Card>,
    public readonly trigger: Trigger,
  ) {}
}

export class IsDeadlineChangeTriggeredQuery {
  constructor(
    public readonly card: Card,
    public readonly update: Partial<Card>,
    public readonly trigger: Trigger,
  ) {}
}

export class IsBasicChangeTriggeredQuery {
  constructor(
    public readonly card: Card,
    public readonly update: Partial<Card>,
    public readonly trigger: Trigger,
  ) {}
}

export const triggerIdToQueryHandlerMap = {
  statusChange: IsStatusChangeTriggeredQuery,
  columnChange: IsBasicChangeTriggeredQuery,
  assigneeChange: IsMemberChangeTriggeredQuery,
  reviewerChange: IsMemberChangeTriggeredQuery,
  deadlineChange: IsDeadlineChangeTriggeredQuery,
  typeChange: IsBasicChangeTriggeredQuery,
  priorityChange: IsBasicChangeTriggeredQuery,
};

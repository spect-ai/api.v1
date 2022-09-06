import {
  PerformAutomationCommandContainer,
  Trigger,
} from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';

export class IsStatusChangeTriggeredQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly trigger: Trigger,
  ) {}
}
export class IsBasicChangeTriggeredQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly trigger: Trigger,
  ) {}
}

export class IsDeadlineChangeTriggeredQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly trigger: Trigger,
  ) {}
}

export class IsMemberChangeTriggeredQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly trigger: Trigger,
  ) {}
}

export class IsSubmissionTriggeredQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly trigger: Trigger,
  ) {}
}

export class IsRevisionInstructionsTriggeredQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly trigger: Trigger,
  ) {}
}

export class IsCardCreatedTriggeredQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly trigger: Trigger,
  ) {}
}

export const triggerIdToQueryHandlerMap = {
  statusChange: IsStatusChangeTriggeredQuery,
  columnChange: IsBasicChangeTriggeredQuery,
  priorityChange: IsBasicChangeTriggeredQuery,
  deadlineChange: IsDeadlineChangeTriggeredQuery,
  assigneeChange: IsMemberChangeTriggeredQuery,
  reviewerChange: IsMemberChangeTriggeredQuery,
  typeChange: IsBasicChangeTriggeredQuery,
  submission: IsSubmissionTriggeredQuery,
  revisionInstructions: IsRevisionInstructionsTriggeredQuery,
  cardCreate: IsCardCreatedTriggeredQuery,
};

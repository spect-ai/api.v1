import {
  Condition,
  PerformAutomationCommandContainer,
} from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';

export class HasSatisfiedConditionsQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly caller: string,
    public readonly conditions: Condition[],
  ) {}
}

export class HasSatisfiedStatusConditionQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly condition: Condition,
  ) {}
}

export class HasSatisfiedBasicConditionQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly condition: Condition,
  ) {}
}

export class HasSatisfiedMemberConditionQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly condition: Condition,
  ) {}
}

export class HasSatisfiedDeadlineConditionQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly condition: Condition,
  ) {}
}

export class HasSatisfiedStartDateConditionQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly condition: Condition,
  ) {}
}

export class HasSatisfiedCardsOnSameLevelConditionQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly condition: Condition,
  ) {}
}

export const conditionIdToConditionQueryMap = {
  checkStatus: HasSatisfiedStatusConditionQuery,
  checkColumn: HasSatisfiedBasicConditionQuery,
  checkParent: HasSatisfiedBasicConditionQuery,
  checkDeadline: HasSatisfiedDeadlineConditionQuery,
  checkStartDate: HasSatisfiedStartDateConditionQuery,
  checkAssignee: HasSatisfiedMemberConditionQuery,
  checkReviewer: HasSatisfiedMemberConditionQuery,
  checkLabel: HasSatisfiedBasicConditionQuery,
  checkCardsOnSameLevel: HasSatisfiedCardsOnSameLevelConditionQuery,
};

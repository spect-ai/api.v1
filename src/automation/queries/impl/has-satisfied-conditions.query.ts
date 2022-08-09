import { Condition } from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';

export class HasSatisfiedConditionsQuery {
  constructor(
    public readonly card: Card,
    public readonly conditions: Condition[],
  ) {}
}

export class HasSatisfiedStatusConditionQuery {
  constructor(
    public readonly card: Card,
    public readonly condition: Condition,
  ) {}
}

export class HasSatisfiedBasicConditionQuery {
  constructor(
    public readonly card: Card,
    public readonly condition: Condition,
  ) {}
}

export class HasSatisfiedMemberConditionQuery {
  constructor(
    public readonly card: Card,
    public readonly condition: Condition,
  ) {}
}

export class HasSatisfiedDeadlineConditionQuery {
  constructor(
    public readonly card: Card,
    public readonly condition: Condition,
  ) {}
}

export const conditionIdToConditionQueryMap = {
  checkStatus: HasSatisfiedStatusConditionQuery,
  checkColumn: HasSatisfiedBasicConditionQuery,
  checkParent: HasSatisfiedBasicConditionQuery,
  checkDeadline: HasSatisfiedDeadlineConditionQuery,
  checkAssignee: HasSatisfiedMemberConditionQuery,
  checkReviewer: HasSatisfiedMemberConditionQuery,
  checkLabel: HasSatisfiedBasicConditionQuery,
};

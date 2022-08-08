import { Condition } from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';

export class HasSatisfiedConditionsQuery {
  constructor(
    public readonly card: Card,
    public readonly condition: Condition[],
  ) {}
}

export class IsSatisfiedStatusConditionQuery {
  constructor(
    public readonly card: Card,
    public readonly update: Partial<Card>,
    public readonly condition: Condition,
  ) {}
}

export const conditionIdToConditionMap = {};

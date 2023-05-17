import { Condition } from 'src/circle/types';
import { Collection } from 'src/collection/model/collection.model';
import { ConditionGroup } from 'src/collection/types/types';

export class HasSatisfiedDataConditionsQuery {
  constructor(
    public readonly collection: Collection,
    public readonly data: any,
    public readonly conditions: Condition[],
    public readonly operator: 'and' | 'or' = 'and',
  ) {}
}

export class HasSatisfiedAdvancedDataConditionsQuery {
  constructor(
    public readonly collection: Collection,
    public readonly data: any,
    public readonly rootConditionGroup: ConditionGroup,
  ) {}
}

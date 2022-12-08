import { Condition } from 'src/circle/types';
import { Collection } from 'src/collection/model/collection.model';

export class HasSatisfiedDataConditionsQuery {
  constructor(
    public readonly collection: Collection,
    public readonly data: any,
    public readonly conditions: Condition[],
  ) {}
}

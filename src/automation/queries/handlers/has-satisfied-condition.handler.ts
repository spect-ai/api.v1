import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { BasicCondition } from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';
import {
  HasSatisfiedBasicConditionQuery,
  HasSatisfiedStatusConditionQuery,
  HasSatisfiedMemberConditionQuery,
  HasSatisfiedDeadlineConditionQuery,
  HasSatisfiedConditionsQuery,
  conditionIdToConditionQueryMap,
} from '../impl/has-satisfied-conditions.query';

@QueryHandler(HasSatisfiedConditionsQuery)
export class HasSatisfiedConditionsQueryHandler
  implements IQueryHandler<HasSatisfiedConditionsQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: HasSatisfiedConditionsQuery): Promise<boolean> {
    console.log('HasSatisfiedConditionsQueryHandler');

    const { card, conditions } = query;

    for (const condition of conditions) {
      const conditionQuery = conditionIdToConditionQueryMap[condition.id];
      if (!(await this.queryBus.execute(new conditionQuery(card, condition)))) {
        return false;
      }
    }

    return true;
  }
}
@QueryHandler(HasSatisfiedBasicConditionQuery)
export class HasSatisfiedBasicConditionQueryHandler
  implements IQueryHandler<HasSatisfiedBasicConditionQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: HasSatisfiedBasicConditionQuery): Promise<boolean> {
    console.log('HasSatisfiedBasicConditionQueryHandler');

    const { card, condition } = query;
    switch (condition.id) {
      case 'checkColumn':
        return this.satisfies(
          card,
          'columnId',
          condition.item as BasicCondition,
        );
      case 'checkPriority':
        return this.satisfies(
          card,
          'priority',
          condition.item as BasicCondition,
        );
      case 'checkParent':
        return this.satisfies(card, 'parent', condition.item as BasicCondition);
      default:
        return true;
    }
  }

  satisfies(card: Card, field: string, item: BasicCondition): boolean {
    if (item.isEmpty === true) {
      return (
        card[field] === null ||
        card[field] === undefined ||
        card[field] === '' ||
        (Array.isArray(card[field]) && card[field].length === 0) ||
        (typeof card[field] === 'object' &&
          Object.keys(card[field]).length === 0)
      );
    }
    if (item.isEmpty === false) {
      if (Array.isArray(card[field])) {
        return card[field].length > 0;
      }
      if (typeof card[field] === 'object') {
        return Object.keys(card[field]).length > 0;
      }
      return (
        card[field] !== null && card[field] !== undefined && card[field] !== ''
      );
    }
    if (item.is) {
      return card[field] === item.is;
    }
    return true;
  }
}

@QueryHandler(HasSatisfiedStatusConditionQuery)
export class HasSatisfiedStatusConditionQueryHandler
  implements IQueryHandler<HasSatisfiedStatusConditionQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: HasSatisfiedStatusConditionQuery): Promise<boolean> {
    console.log('HasSatisfiedStatusConditionQueryHandler');

    const { card, condition } = query;

    for (const [statusKey, status] of Object.entries(condition.item.is)) {
      if (card.status[statusKey] !== status) {
        return false;
      }
    }

    return true;
  }
}

@QueryHandler(HasSatisfiedMemberConditionQuery)
export class HasSatisfiedMemberConditionQueryHandler
  implements IQueryHandler<HasSatisfiedMemberConditionQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: HasSatisfiedMemberConditionQuery): Promise<boolean> {
    console.log('HasSatisfiedMemberConditionQueryHandler');

    const { card, condition } = query;

    return true;
  }
}

@QueryHandler(HasSatisfiedDeadlineConditionQuery)
export class HasSatisfiedDeadlineConditionQueryHandler
  implements IQueryHandler<HasSatisfiedDeadlineConditionQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: HasSatisfiedDeadlineConditionQuery): Promise<boolean> {
    console.log('HasSatisfiedDeadlineConditionQueryHandler');

    const { card, condition } = query;

    return true;
  }
}

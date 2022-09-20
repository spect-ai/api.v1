import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import {
  BasicCondition,
  CheckCardsOnSameLevelCondition,
  StatusCondition,
} from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';
import {
  HasSatisfiedBasicConditionQuery,
  HasSatisfiedStatusConditionQuery,
  HasSatisfiedMemberConditionQuery,
  HasSatisfiedDeadlineConditionQuery,
  HasSatisfiedStartDateConditionQuery,
  HasSatisfiedConditionsQuery,
  conditionIdToConditionQueryMap,
  HasSatisfiedCardsOnSameLevelConditionQuery,
} from '../impl/has-satisfied-conditions.query';
import { diff as arrayDiff, same as arraySame } from 'fast-array-diff';

@QueryHandler(HasSatisfiedConditionsQuery)
export class HasSatisfiedConditionsQueryHandler
  implements IQueryHandler<HasSatisfiedConditionsQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: HasSatisfiedConditionsQuery): Promise<boolean> {
    console.log('HasSatisfiedConditionsQueryHandler');

    const { performAutomationCommandContainer, caller, conditions } = query;
    const { card, project, circle, retro } = performAutomationCommandContainer;

    for (const condition of conditions) {
      const conditionQuery = conditionIdToConditionQueryMap[condition.id];
      if (
        !(await this.queryBus.execute(
          new conditionQuery(performAutomationCommandContainer, condition),
        ))
      ) {
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

    const { performAutomationCommandContainer, condition } = query;
    const { card } = performAutomationCommandContainer;
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

    const { performAutomationCommandContainer, condition } = query;
    const { card } = performAutomationCommandContainer;
    const item = condition.item as StatusCondition;
    for (const [statusKey, status] of Object.entries(item.is)) {
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

    const { performAutomationCommandContainer, condition } = query;
    const { card } = performAutomationCommandContainer;
    const memberType =
      condition.id === 'checkAssignee' ? 'assignee' : 'reviewer';

    for (const [conditionKey, conditionValue] of Object.entries(
      condition.item,
    )) {
      if (conditionKey === 'isEmpty') {
        if (conditionValue === true) {
          if (card[memberType].length > 0) {
            return false;
          }
        }
      }
      if (conditionKey === 'is') {
        if (!arraySame(card[memberType], conditionValue)) {
          return false;
        }
      }
      if (conditionKey === 'has') {
        for (const member of conditionValue) {
          if (!card[memberType].includes(member)) {
            return false;
          }
        }
      }
      if (conditionKey === 'doesNotHave') {
        for (const member of conditionValue) {
          if (card[memberType].includes(member)) {
            return false;
          }
        }
      }
      if (conditionKey === 'hasCount') {
        if (card[memberType].length !== conditionValue) {
          return false;
        }
      }
      if (conditionKey === 'hasCountLessThan') {
        if (card[memberType].length >= conditionValue) {
          return false;
        }
      }
      if (conditionKey === 'hasCountGreaterThan') {
        if (card[memberType].length <= conditionValue) {
          return false;
        }
      }
    }

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

    const { performAutomationCommandContainer, condition } = query;
    const { card } = performAutomationCommandContainer;
    return true;
  }
}

@QueryHandler(HasSatisfiedStartDateConditionQuery)
export class HasSatisfiedStartDateConditionQueryHandler
  implements IQueryHandler<HasSatisfiedStartDateConditionQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: HasSatisfiedStartDateConditionQuery): Promise<boolean> {
    console.log('HasSatisfiedStartDateConditionQuery');

    const { performAutomationCommandContainer, condition } = query;
    const { card } = performAutomationCommandContainer;
    return true;
  }
}

@QueryHandler(HasSatisfiedCardsOnSameLevelConditionQuery)
export class HasSatisfiedCardsOnSameLevelConditionQueryHandler
  implements IQueryHandler<HasSatisfiedCardsOnSameLevelConditionQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    query: HasSatisfiedCardsOnSameLevelConditionQuery,
  ): Promise<boolean> {
    console.log('HasSatisfiedCardsOnSameLevelConditionQueryHandler');

    const { performAutomationCommandContainer, condition } = query;
    const { card, misc } = performAutomationCommandContainer;
    const item = condition.item as CheckCardsOnSameLevelCondition;

    if (misc.cardsOnSameLevel) {
      for (const cardOnSameLevel of misc.cardsOnSameLevel) {
        if (item.status) {
          for (const [statusKey, val] of Object.entries(item.status)) {
            if (cardOnSameLevel.status[statusKey] !== val) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }
}

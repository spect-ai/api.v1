import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';
import {
  BasicTrigger,
  MemberChangeTrigger,
  StatusChangeTrigger,
} from 'src/automation/types/types';
import { CommonTools } from 'src/common/common.service';
import {
  IsBasicChangeTriggeredQuery,
  IsDeadlineChangeTriggeredQuery,
  IsMemberChangeTriggeredQuery,
  IsStatusChangeTriggeredQuery,
} from '../impl/is-triggered.query';
import { detailedDiff as objectDiff } from 'deep-object-diff';
import { same as arraySame } from 'fast-array-diff';

@QueryHandler(IsStatusChangeTriggeredQuery)
export class IsStatusTriggeredQueryHandler
  implements IQueryHandler<IsStatusChangeTriggeredQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: IsStatusChangeTriggeredQuery): Promise<boolean> {
    console.log('IsStatusTriggeredQueryHandler');

    const { card, update, trigger } = query;
    for (const [key, value] of Object.entries(
      (trigger.item as StatusChangeTrigger).from,
    )) {
      console.log(value);
      console.log(card.status);

      if (value !== card.status[key]) {
        return false;
      }
    }

    for (const [key, value] of Object.entries(
      (trigger.item as StatusChangeTrigger).to,
    )) {
      console.log(value);
      console.log(update.status);
      if (value !== update.status[key]) {
        return false;
      }
    }

    return true;
  }
}

@QueryHandler(IsMemberChangeTriggeredQuery)
export class IsMemberChangeTriggeredQueryHandler
  implements IQueryHandler<IsMemberChangeTriggeredQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(query: IsMemberChangeTriggeredQuery): Promise<boolean> {
    console.log('IsMemberChangeTriggeredQueryHandler');

    const { card, update, trigger } = query;

    const memberType =
      trigger.id === 'assigneeChange' ? 'assignee' : 'reviewer';
    if (!update[memberType]) return false;

    const from = (trigger.item as MemberChangeTrigger).from;
    const to = (trigger.item as MemberChangeTrigger).to;
    const fromNotEmptyToEmpty = (trigger.item as MemberChangeTrigger)
      .fromNotEmptyToEmpty;
    const fromEmptytoNotEmpty = (trigger.item as MemberChangeTrigger)
      .fromEmptytoNotEmpty;
    const countReducedFrom = (trigger.item as MemberChangeTrigger)
      .countReducedFrom;
    const countIncreasedFrom = (trigger.item as MemberChangeTrigger)
      .countIncreasedFrom;

    if (from) {
      if (!arraySame(from, card[memberType])) {
        return false;
      }
    }
    if (to) {
      if (!arraySame(to, update[memberType])) {
        return false;
      }
    }

    if (fromNotEmptyToEmpty) {
      if (card[memberType].length === 0 || update[memberType].length > 0) {
        return false;
      }
    }

    if (fromEmptytoNotEmpty) {
      if (card[memberType].length > 0 || update[memberType].length === 0) {
        return false;
      }
    }

    if (countReducedFrom) {
      if (
        card[memberType].length !== countReducedFrom ||
        update[memberType].length >= countReducedFrom
      ) {
        return false;
      }
    }
    if (countIncreasedFrom) {
      if (
        card[memberType].length !== countIncreasedFrom ||
        update[memberType].length <= countIncreasedFrom
      ) {
        return false;
      }
    }

    return true;
  }
}

@QueryHandler(IsBasicChangeTriggeredQuery)
export class IsBasicChangeTriggeredQueryHandler
  implements IQueryHandler<IsBasicChangeTriggeredQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: IsBasicChangeTriggeredQuery): Promise<boolean> {
    console.log('IsBasicChangeTriggeredQuery');

    const { card, update, trigger } = query;
    const from = (trigger.item as BasicTrigger).from;
    const to = (trigger.item as BasicTrigger).to;
    if (!from && !to) return false;
    if (from && (from !== card.columnId || from === update.columnId)) {
      return false;
    }

    if (to && (to !== update.columnId || to === card.columnId)) {
      return false;
    }

    return true;
  }
}

@QueryHandler(IsDeadlineChangeTriggeredQuery)
export class IsDeadlineChangeTriggeredQueryHandler
  implements IQueryHandler<IsDeadlineChangeTriggeredQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: IsDeadlineChangeTriggeredQuery): Promise<boolean> {
    console.log('IsDeadlineChangeTriggeredQuery');

    return true;
  }
}

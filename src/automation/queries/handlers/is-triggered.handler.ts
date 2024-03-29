import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';
import {
  BasicTrigger,
  CardCreateTrigger,
  MemberChangeTrigger,
  StatusChangeTrigger,
  SubmissionTrigger,
} from 'src/automation/types/types';
import { CommonTools } from 'src/common/common.service';
import {
  IsBasicChangeTriggeredQuery,
  IsCardCreatedTriggeredQuery,
  IsDeadlineChangeTriggeredQuery,
  IsStartDateChangeTriggeredQuery,
  IsMemberChangeTriggeredQuery,
  IsStatusChangeTriggeredQuery,
  IsSubmissionTriggeredQuery,
} from '../impl/is-triggered.query';
import { detailedDiff as objectDiff } from 'deep-object-diff';
import { same as arraySame } from 'fast-array-diff';
import { Card } from 'src/card/model/card.model';
import { CardCreatedEvent } from 'src/card/events/impl';

@QueryHandler(IsStatusChangeTriggeredQuery)
export class IsStatusTriggeredQueryHandler
  implements IQueryHandler<IsStatusChangeTriggeredQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: IsStatusChangeTriggeredQuery): Promise<boolean> {
    console.log('IsStatusTriggeredQueryHandler');

    const { performAutomationCommandContainer, trigger } = query;
    const { card, update } = performAutomationCommandContainer;
    for (const [key, value] of Object.entries(
      (trigger.item as StatusChangeTrigger).from,
    )) {
      if (value !== card.status[key]) {
        return false;
      }
    }

    for (const [key, value] of Object.entries(
      (trigger.item as StatusChangeTrigger).to,
    )) {
      if (value !== (update as Partial<Card>).status[key]) {
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

    const { performAutomationCommandContainer, trigger } = query;
    const { card, update } = performAutomationCommandContainer;
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

    const { performAutomationCommandContainer, trigger } = query;
    const { card, update } = performAutomationCommandContainer;
    const from = (trigger.item as BasicTrigger).from;
    const to = (trigger.item as BasicTrigger).to;
    if (!from && !to) return false;
    if (
      from &&
      (from !== card.columnId || from === (update as Partial<Card>).columnId)
    ) {
      return false;
    }

    if (
      to &&
      (to !== (update as Partial<Card>).columnId || to === card.columnId)
    ) {
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

    const { performAutomationCommandContainer, trigger } = query;
    const { card, update } = performAutomationCommandContainer;

    return true;
  }
}

@QueryHandler(IsStartDateChangeTriggeredQuery)
export class IsStartDateChangeTriggeredQueryHandler
  implements IQueryHandler<IsStartDateChangeTriggeredQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: IsStartDateChangeTriggeredQuery): Promise<boolean> {
    console.log('IsStartDateChangeTriggeredQuery');

    const { performAutomationCommandContainer, trigger } = query;
    const { card, update } = performAutomationCommandContainer;

    return true;
  }
}

@QueryHandler(IsSubmissionTriggeredQuery)
export class IsSubmissionTriggeredQueryHandler
  implements IQueryHandler<IsSubmissionTriggeredQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: IsSubmissionTriggeredQuery): Promise<boolean> {
    console.log('IsSubmissionTriggeredQueryHandler');
    const { performAutomationCommandContainer, trigger } = query;
    const { card, update } = performAutomationCommandContainer;
    const item = trigger.item as SubmissionTrigger;

    if (item.lastOneHasStatus) {
      const workThreads = Object.values((update as Partial<Card>).workThreads);
      const currentWorkThread = workThreads[workThreads.length - 1];
      if (!(currentWorkThread.status === item.lastOneHasStatus)) return false;
    }

    if (item.allHaveStatus) {
      for (const workThread of Object.values(
        (update as Partial<Card>).workThreads,
      )) {
        if (workThread.status !== item.allHaveStatus) return false;
      }
    }

    if (item.atLeastOneHasStatus) {
      for (const workThread of Object.values(
        (update as Partial<Card>).workThreads,
      )) {
        if (workThread.status === item.atLeastOneHasStatus) return true;
      }
      return false;
    }

    return true;
  }
}

@QueryHandler(IsCardCreatedTriggeredQuery)
export class IsCardCreatedTriggeredQueryHandler
  implements IQueryHandler<IsCardCreatedTriggeredQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: IsCardCreatedTriggeredQuery): Promise<boolean> {
    console.log('IsCardCreatedTriggeredQueryHandler');
    const { performAutomationCommandContainer, trigger } = query;
    const { misc, card } = performAutomationCommandContainer;

    const item = trigger.item as CardCreateTrigger;

    if (!misc.createCard) return false;
    if (item.projectId !== card.project) return false;
    if (item.columnId && item.columnId !== card.columnId) return false;
    if (item.isParent && card.parent) return false;
    return true;
  }
}

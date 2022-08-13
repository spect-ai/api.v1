import { GetTriggeredAutomationsQueryHandler } from './get-triggered-automation.handler';
import {
  HasSatisfiedConditionsQueryHandler,
  HasSatisfiedBasicConditionQueryHandler,
  HasSatisfiedDeadlineConditionQueryHandler,
  HasSatisfiedMemberConditionQueryHandler,
  HasSatisfiedStatusConditionQueryHandler,
} from './has-satisfied-condition.handler';
import {
  IsBasicChangeTriggeredQueryHandler,
  IsStatusTriggeredQueryHandler,
  IsDeadlineChangeTriggeredQueryHandler,
  IsMemberChangeTriggeredQueryHandler,
} from './is-triggered.handler';

export const QueryHandlers = [
  GetTriggeredAutomationsQueryHandler,
  IsStatusTriggeredQueryHandler,
  IsBasicChangeTriggeredQueryHandler,
  IsDeadlineChangeTriggeredQueryHandler,
  IsMemberChangeTriggeredQueryHandler,
  HasSatisfiedConditionsQueryHandler,
  HasSatisfiedBasicConditionQueryHandler,
  HasSatisfiedDeadlineConditionQueryHandler,
  HasSatisfiedMemberConditionQueryHandler,
  HasSatisfiedStatusConditionQueryHandler,
];

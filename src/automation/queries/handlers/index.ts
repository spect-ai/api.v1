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
  IsSubmissionTriggeredQueryHandler,
  IsCardCreatedTriggeredQueryHandler,
} from './is-triggered.handler';

export const QueryHandlers = [
  GetTriggeredAutomationsQueryHandler,
  IsStatusTriggeredQueryHandler,
  IsBasicChangeTriggeredQueryHandler,
  IsDeadlineChangeTriggeredQueryHandler,
  IsMemberChangeTriggeredQueryHandler,
  IsSubmissionTriggeredQueryHandler,
  IsCardCreatedTriggeredQueryHandler,
  HasSatisfiedConditionsQueryHandler,
  HasSatisfiedBasicConditionQueryHandler,
  HasSatisfiedDeadlineConditionQueryHandler,
  HasSatisfiedMemberConditionQueryHandler,
  HasSatisfiedStatusConditionQueryHandler,
];

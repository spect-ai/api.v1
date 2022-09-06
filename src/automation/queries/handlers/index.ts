import { GetTriggeredAutomationsQueryHandler } from './get-triggered-automation.handler';
import {
  HasSatisfiedConditionsQueryHandler,
  HasSatisfiedBasicConditionQueryHandler,
  HasSatisfiedDeadlineConditionQueryHandler,
  HasSatisfiedStartDateConditionQueryHandler,
  HasSatisfiedMemberConditionQueryHandler,
  HasSatisfiedStatusConditionQueryHandler,
} from './has-satisfied-condition.handler';
import {
  IsBasicChangeTriggeredQueryHandler,
  IsStatusTriggeredQueryHandler,
  IsDeadlineChangeTriggeredQueryHandler,
  IsStartDateChangeTriggeredQueryHandler,
  IsMemberChangeTriggeredQueryHandler,
  IsSubmissionTriggeredQueryHandler,
  IsCardCreatedTriggeredQueryHandler,
} from './is-triggered.handler';

export const QueryHandlers = [
  GetTriggeredAutomationsQueryHandler,
  IsStatusTriggeredQueryHandler,
  IsBasicChangeTriggeredQueryHandler,
  IsDeadlineChangeTriggeredQueryHandler,
  IsStartDateChangeTriggeredQueryHandler,
  IsMemberChangeTriggeredQueryHandler,
  IsSubmissionTriggeredQueryHandler,
  IsCardCreatedTriggeredQueryHandler,
  HasSatisfiedConditionsQueryHandler,
  HasSatisfiedBasicConditionQueryHandler,
  HasSatisfiedDeadlineConditionQueryHandler,
  HasSatisfiedStartDateConditionQueryHandler,
  HasSatisfiedMemberConditionQueryHandler,
  HasSatisfiedStatusConditionQueryHandler,
];

import { GetTriggeredCollectionAutomationsQueryHandler } from './get-triggered-automation.handler';
import {
  HasSatisfiedAdvancedDataConditionsQueryHandler,
  HasSatisfiedDataConditionsQueryHandler,
} from './has-satisfied-conditions-v2.handler';
import { IsTriggeredSelectFieldQueryHandler } from './is-triggered-v2.handler';

export const QueryHandlers = [
  IsTriggeredSelectFieldQueryHandler,
  HasSatisfiedDataConditionsQueryHandler,
  GetTriggeredCollectionAutomationsQueryHandler,
  HasSatisfiedAdvancedDataConditionsQueryHandler,
];

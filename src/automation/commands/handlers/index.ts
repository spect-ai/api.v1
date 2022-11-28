import { PerformAutomationOnCollectionDataUpdateCommandHandler } from './perform-automation-v2.handler';
import {
  PerformAutomationCommandHandler,
  PerformMultipleAutomationsCommandHandler,
} from './perform-automation.handler';
import {
  GiveRoleActionCommandHandler,
  SendEmailActionCommandHandler,
} from './take -action-v2.handler';
import {
  ChangeColumnActionCommandHandler,
  ChangeLabelActionCommandHandler,
  ChangeMemberActionCommandHandler,
  ChangeSimpleFieldActionCommandHandler,
  ChangeStatusActionCommandHandler,
  CloseCardActionCommandHandler,
} from './take-action.handler';

export const CommandHandlers = [
  PerformAutomationCommandHandler,
  PerformMultipleAutomationsCommandHandler,
  ChangeStatusActionCommandHandler,
  ChangeSimpleFieldActionCommandHandler,
  ChangeColumnActionCommandHandler,
  ChangeMemberActionCommandHandler,
  ChangeLabelActionCommandHandler,
  CloseCardActionCommandHandler,

  PerformAutomationOnCollectionDataUpdateCommandHandler,
  GiveRoleActionCommandHandler,
  SendEmailActionCommandHandler,
];

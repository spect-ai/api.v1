import {
  PerformAutomationCommandHandler,
  PerformMultipleAutomationsCommandHandler,
} from './perform-automation.handler';
import {
  ChangeColumnActionCommandHandler,
  ChangeLabelActionCommandHandler,
  ChangeMemberActionCommandHandler,
  ChangeSimpleFieldActionCommandHandler,
  ChangeStatusActionCommandHandler,
} from './take-action.handler';

export const CommandHandlers = [
  PerformAutomationCommandHandler,
  PerformMultipleAutomationsCommandHandler,
  ChangeStatusActionCommandHandler,
  ChangeSimpleFieldActionCommandHandler,
  ChangeColumnActionCommandHandler,
  ChangeMemberActionCommandHandler,
  ChangeLabelActionCommandHandler,
];

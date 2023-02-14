import {
  PerformAutomationOnCollectionDataAddCommandHandler,
  PerformAutomationOnCollectionDataUpdateCommandHandler,
  PerformAutomationOnPaymentCompleteCommandHandler,
  PerformAutomationOnPaymentCancelledCommandHandler,
} from './perform-automation-v2.handler';
import {
  PerformAutomationCommandHandler,
  PerformMultipleAutomationsCommandHandler,
} from './perform-automation.handler';
import {
  CreateCardActionCommandHandler,
  CreateDiscordChannelActionCommandHandler,
  GiveDiscordRoleActionCommandHandler,
  GiveRoleActionCommandHandler,
  PostOnDiscordActionCommandHandler,
  InitiatePendingPaymentActionCommandHandler,
  SendEmailActionCommandHandler,
  StartVotingPeriodActionCommandHandler,
  CloseCardActionCommandHandler,
} from './take -action-v2.handler';
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

  PerformAutomationOnCollectionDataUpdateCommandHandler,
  GiveRoleActionCommandHandler,
  SendEmailActionCommandHandler,
  CreateDiscordChannelActionCommandHandler,
  GiveDiscordRoleActionCommandHandler,
  CreateCardActionCommandHandler,
  PerformAutomationOnCollectionDataAddCommandHandler,
  PerformAutomationOnPaymentCompleteCommandHandler,
  PerformAutomationOnPaymentCancelledCommandHandler,
  StartVotingPeriodActionCommandHandler,
  PostOnDiscordActionCommandHandler,
  CloseCardActionCommandHandler,
  InitiatePendingPaymentActionCommandHandler,
];

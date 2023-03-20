import {
  PerformAutomationOnCollectionDataAddCommandHandler,
  PerformAutomationOnCollectionDataUpdateCommandHandler,
  PerformAutomationOnPaymentCompleteCommandHandler,
  PerformAutomationOnPaymentCancelledCommandHandler,
} from './perform-automation-v2.handler';
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
  CreateDiscordThreadCommandHandler,
  PostOnDiscordThreadCommandHandler,
} from './take -action-v2.handler';

export const CommandHandlers = [
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
  CreateDiscordThreadCommandHandler,
  PostOnDiscordThreadCommandHandler,
];

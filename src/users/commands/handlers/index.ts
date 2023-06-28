import { RemoveItemsCommandHandler } from './remove-items.handler';
import { AddItemCommandHandler } from './add-items.handler';
import { MoveItemCommandHandler } from './move-item.handler';
import { GetCirclesCommandHandler } from '../metadata/handlers/get-circles.handler';
import { GetResponsesCommandHandler } from '../metadata/handlers/get-responses.handler';
import { SetUnreadNotificationsCommandHandler } from '../notifications/handlers/set-unread-notifications.handler';

import {
  ConnectDiscordCommandHandler,
  DisconnectDiscordCommandHandler,
} from './connect-discord.handler';
import {
  ConnectGithubCommandHandler,
  DisconnectGithubCommandHandler,
} from './connect-github.handler';
import { GetReferralCodeCommandHandler } from './get-referralCode.handler';
import { WithdrawBonusCommandHandler } from './withdraw-bonus.handler';

export const CommandHandlers = [
  AddItemCommandHandler,
  MoveItemCommandHandler,
  RemoveItemsCommandHandler,
  GetCirclesCommandHandler,
  GetResponsesCommandHandler,
  SetUnreadNotificationsCommandHandler,
  ConnectDiscordCommandHandler,
  DisconnectDiscordCommandHandler,
  ConnectGithubCommandHandler,
  DisconnectGithubCommandHandler,
  GetReferralCodeCommandHandler,
  WithdrawBonusCommandHandler,
];

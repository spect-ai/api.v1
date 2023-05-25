import { RemoveItemsCommandHandler } from './remove-items.handler';
import { AddItemCommandHandler } from './add-items.handler';
import { MoveItemCommandHandler } from './move-item.handler';
import { ReadNotificationCommandHandler } from '../notifications/handlers/read-notifications.handler';
import { GetCirclesCommandHandler } from '../metadata/handlers/get-circles.handler';
import { GetResponsesCommandHandler } from '../metadata/handlers/get-responses.handler';
import { SetUnreadNotificationsCommandHandler } from '../notifications/handlers/set-unread-notifications.handler';
import { UpdateUserCommandHandler } from './update-user.handler';
import {
  CheckUserTokensCommandHandler,
  GetTokenMetadataCommandHandler,
  GetTokensCommandHandler,
} from './get-tokens.handler';
import { ConnectDiscordCommandHandler } from './connect-discord.handler';

export const CommandHandlers = [
  AddItemCommandHandler,
  MoveItemCommandHandler,
  RemoveItemsCommandHandler,
  ReadNotificationCommandHandler,
  GetCirclesCommandHandler,
  GetResponsesCommandHandler,
  SetUnreadNotificationsCommandHandler,
  UpdateUserCommandHandler,
  GetTokensCommandHandler,
  CheckUserTokensCommandHandler,
  GetTokenMetadataCommandHandler,
  ConnectDiscordCommandHandler,
];

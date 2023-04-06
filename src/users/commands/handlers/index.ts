import { RemoveItemsCommandHandler } from './remove-items.handler';
import { AddItemCommandHandler } from './add-items.handler';
import { MoveItemCommandHandler } from './move-item.handler';
import { ReadNotificationCommandHandler } from '../notifications/handlers/read-notifications.handler';
import { AddExperienceCommandHandler } from '../experience/handlers/add-experience.handler';
import { UpdateExperienceCommandHandler } from '../experience/handlers/update-experience.handler';
import { RemoveExperienceCommandHandler } from '../experience/handlers/remove-experience.handler';
import { AddEducationCommandHandler } from '../education/handlers/add-education.handler';
import { RemoveEducationCommandHandler } from '../education/handlers/remove-education.handler';
import { UpdateEducationCommandHandler } from '../education/handlers/update-education.handler';
import { GetCirclesCommandHandler } from '../metadata/handlers/get-circles.handler';
import { GetResponsesCommandHandler } from '../metadata/handlers/get-responses.handler';
import { SetUnreadNotificationsCommandHandler } from '../notifications/handlers/set-unread-notifications.handler';
import { UpdateUserCommandHandler } from './update-user.handler';
import {
  CheckUserTokensCommandHandler,
  GetTokenMetadataCommandHandler,
  GetTokensCommandHandler,
} from './get-tokens.handler';

export const CommandHandlers = [
  AddItemCommandHandler,
  MoveItemCommandHandler,
  RemoveItemsCommandHandler,
  ReadNotificationCommandHandler,
  AddExperienceCommandHandler,
  UpdateExperienceCommandHandler,
  RemoveExperienceCommandHandler,
  AddEducationCommandHandler,
  RemoveEducationCommandHandler,
  UpdateEducationCommandHandler,
  GetCirclesCommandHandler,
  GetResponsesCommandHandler,
  SetUnreadNotificationsCommandHandler,
  UpdateUserCommandHandler,
  GetTokensCommandHandler,
  CheckUserTokensCommandHandler,
  GetTokenMetadataCommandHandler,
];

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
];

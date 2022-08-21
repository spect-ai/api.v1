import { ArchiveProjectCommandHandler } from '../archive/handlers/archive-project.handler';
import { RevertArchivedProjectCommandHandler } from '../archive/handlers/revert-archive.handler';
import {
  AddCardsCommandHandler,
  AddCardsInMultipleProjectsCommandHandler,
} from '../cards/handlers/add-cards.handler';
import {
  RemoveCardsCommandHandler,
  RemoveCardsInMultipleProjectsCommandHandler,
} from '../cards/handlers/remove-cards.handler';
import { DeleteProjectByIdCommandHandler } from './delete-project.handler';
import { CreateAutomationCommandHandler } from '../automation/handlers/create-automation.handler';

export const CommandHandlers = [
  AddCardsCommandHandler,
  RemoveCardsCommandHandler,
  DeleteProjectByIdCommandHandler,
  RemoveCardsInMultipleProjectsCommandHandler,
  AddCardsInMultipleProjectsCommandHandler,
  ArchiveProjectCommandHandler,
  RevertArchivedProjectCommandHandler,
];

import { AddCardsCommandHandler } from '../cards/handlers/add-cards.handler';
import { RemoveCardsCommandHandler } from '../cards/handlers/remove-cards.handler';
import { DeleteProjectByIdCommandHandler } from './delete-project.handler';

export const CommandHandlers = [
  AddCardsCommandHandler,
  RemoveCardsCommandHandler,
  DeleteProjectByIdCommandHandler,
];
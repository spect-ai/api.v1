import { ArchiveCardByIdCommandHandler } from '../archive/handlers/archive-card.handler';
import { RevertArchiveCardByIdCommandHandler } from '../archive/handlers/revert-archival.handler';
import { AddItemCommandHandler } from '../items/handlers/add-items.handler';
import { RemoveItemsCommandHandler } from '../items/handlers/remove-items.handler';
import { CreateCardCommandHandler } from './create-card.handler';
import {
  DeleteCardByIdCommandHandler,
  DeleteMultipleCardsByIdHandler,
} from './delete-card.handler';

export const CommandHandlers = [
  CreateCardCommandHandler,
  DeleteCardByIdCommandHandler,
  DeleteMultipleCardsByIdHandler,
  ArchiveCardByIdCommandHandler,
  RevertArchiveCardByIdCommandHandler,
  AddItemCommandHandler,
  RemoveItemsCommandHandler,
];

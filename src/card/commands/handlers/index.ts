import {
  ArchiveCardByIdCommandHandler,
  ArchiveMultipleCardsByIdCommandHandler,
} from '../archive/handlers/archive-card.handler';
import {
  RevertArchivalMultipleCardsByIdCommandHandler,
  RevertArchiveCardByIdCommandHandler,
} from '../archive/handlers/revert-archival.handler';
import { AddItemCommandHandler } from '../items/handlers/add-items.handler';
import { RemoveItemsCommandHandler } from '../items/handlers/remove-items.handler';
import { AddKudosCommandHandler } from '../kudos/handlers/add-kudos.handler';
import { UpdatePaymentCommandHandler } from '../payment/handlers/update-payment.handler';
import { UpdateProjectCardCommandHandler } from '../updateCardProject/handlers/update-card-project.handler';
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
  UpdatePaymentCommandHandler,
  ArchiveMultipleCardsByIdCommandHandler,
  RevertArchivalMultipleCardsByIdCommandHandler,
  UpdateProjectCardCommandHandler,
  AddKudosCommandHandler,
];

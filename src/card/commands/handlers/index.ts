import { ArchiveCardCommandHandler } from '../archive/handlers/archive-card.handler';
import { RevertArchivedCardCommandHandler } from '../archive/handlers/revert-archival.handler';
import { AddItemCommandHandler } from '../items/handlers/add-items.handler';
import { RemoveItemsCommandHandler } from '../items/handlers/remove-items.handler';
import { UpdatePaymentCommandHandler } from '../payment/handlers/update-payment.handler';
import { CreateCardCommandHandler } from './create-card.handler';
import {
  DeleteCardByIdCommandHandler,
  DeleteMultipleCardsByIdHandler,
} from './delete-card.handler';

export const CommandHandlers = [
  CreateCardCommandHandler,
  DeleteCardByIdCommandHandler,
  DeleteMultipleCardsByIdHandler,
  ArchiveCardCommandHandler,
  RevertArchivedCardCommandHandler,
  AddItemCommandHandler,
  RemoveItemsCommandHandler,
  UpdatePaymentCommandHandler,
];

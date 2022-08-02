import { CreateCardCommandHandler } from './create-card.handler';
import {
  DeleteCardByIdCommandHandler,
  DeleteMultipleCardsByIdHandler,
} from './delete-card.handler';

export const CommandHandlers = [
  CreateCardCommandHandler,
  DeleteCardByIdCommandHandler,
  DeleteMultipleCardsByIdHandler,
];

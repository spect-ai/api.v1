import { CreateCardCommandHandler } from './create-card.handler';
import { DeleteCardByIdCommandHandler } from './delete-card.handler';

export const CommandHandlers = [
  CreateCardCommandHandler,
  DeleteCardByIdCommandHandler,
];

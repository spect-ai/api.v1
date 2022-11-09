export * from './impl/add-education.command';
export * from './impl/update-education.command';
export * from './impl/remove-education.command';

import { AddEducationCommandHandler } from './handlers/add-education.handler';
import { RemoveEducationCommandHandler } from './handlers/remove-education.handler';
import { UpdateEducationCommandHandler } from './handlers/update-education.handler';

export const CommandHandlers = [
  AddEducationCommandHandler,
  RemoveEducationCommandHandler,
  UpdateEducationCommandHandler,
];

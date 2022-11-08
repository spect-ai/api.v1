export * from './impl/add-education.command';
export * from './impl/update-education.command';
export * from './impl/remove-education.command';

import { AddEducationCommandHandler } from '../education/handlers/add-education.handler';
import { RemoveEducationCommandHandler } from '../education/handlers/remove-education.handler';
import { UpdateEducationCommandHandler } from '../education/handlers/update-education.handler';

export const CommandHandlers = [
  AddEducationCommandHandler,
  RemoveEducationCommandHandler,
  UpdateEducationCommandHandler,
];

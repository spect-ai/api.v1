import { AddExperienceCommandHandler } from './handlers/add-experience.handler';
import { RemoveExperienceCommandHandler } from './handlers/remove-experience.handler';
import { UpdateExperienceCommandHandler } from './handlers/update-experience.handler';

export * from './impl/add-experience.command';
export * from './impl/update-experience.command';
export * from './impl/remove-experience.command';

export const CommandHandlers = [
  AddExperienceCommandHandler,
  UpdateExperienceCommandHandler,
  RemoveExperienceCommandHandler,
];

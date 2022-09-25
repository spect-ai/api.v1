export * from './impl/create-collection.command';
export * from './impl/update-collection.command';
export * from './properties/impl/add-property.command';
export * from './properties/impl/update-property.command';
export * from './properties/impl/remove-property.command';

import { CreateCollectionCommandHandler } from './handlers/create-collection.handler';
import { UpdateCollectionCommandHandler } from './handlers/update-collection.handler';
import { AddPropertyCommandHandler } from './properties/handlers/add-property.handler';
import { RemovePropertyCommandHandler } from './properties/handlers/remove-property.handler';
import { UpdatePropertyCommandHandler } from './properties/handlers/update-property.handler';

export const CommandHandlers = [
  CreateCollectionCommandHandler,
  UpdateCollectionCommandHandler,
  AddPropertyCommandHandler,
  UpdatePropertyCommandHandler,
  RemovePropertyCommandHandler,
];

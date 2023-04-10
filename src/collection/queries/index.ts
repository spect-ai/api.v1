export * from './impl/get-collection.query';
export * from './impl/get-field.query';

import {
  GetCollectionByFilterQueryHandler,
  GetCollectionByIdQueryHandler,
  GetCollectionBySlugQueryHandler,
  GetMultipleCollectionsQueryHandler,
  GetPrivateViewCollectionQueryHandler,
  GetPublicViewCollectionQueryHandler,
} from './handlers/get-collection.handler';
import { GetNextFieldQueryHandler } from './handlers/get-field.handler';

export const QueryHandlers = [
  GetCollectionByFilterQueryHandler,
  GetCollectionByIdQueryHandler,
  GetCollectionBySlugQueryHandler,
  GetMultipleCollectionsQueryHandler,
  GetPrivateViewCollectionQueryHandler,
  GetPublicViewCollectionQueryHandler,
  GetNextFieldQueryHandler,
];

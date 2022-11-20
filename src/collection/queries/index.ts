export * from './impl/get-collection.query';

import {
  GetCollectionByFilterQueryHandler,
  GetCollectionByIdQueryHandler,
  GetCollectionBySlugQueryHandler,
  GetMultipleCollectionsQueryHandler,
  GetPrivateViewCollectionQueryHandler,
  GetPublicViewCollectionQueryHandler,
} from './handlers/get-collection.handler';

export const QueryHandlers = [
  GetCollectionByFilterQueryHandler,
  GetCollectionByIdQueryHandler,
  GetCollectionBySlugQueryHandler,
  GetMultipleCollectionsQueryHandler,
  GetPrivateViewCollectionQueryHandler,
  GetPublicViewCollectionQueryHandler,
  GetCollectionByFilterQueryHandler,
];

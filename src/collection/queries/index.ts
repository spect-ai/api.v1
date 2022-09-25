export * from './handlers/get-collection.handler';

import {
  GetCollectionByFilterQuery,
  GetCollectionByIdQuery,
  GetCollectionBySlugQuery,
  GetMultipleCollectionsQuery,
} from './impl/get-collection.query';

export const QueryHandlers = [
  GetCollectionByIdQuery,
  GetCollectionByFilterQuery,
  GetCollectionBySlugQuery,
  GetMultipleCollectionsQuery,
];

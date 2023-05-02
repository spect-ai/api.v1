export * from './impl/get-collection.query';
export * from './impl/get-field.query';
export * from './impl/get-analytics.query';

import { GetFormAnalyticsBySlugQueryHandler } from './handlers/get-analytics.handler';
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
  GetFormAnalyticsBySlugQueryHandler,
];

import {
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
} from './get-card.handler';

export const QueryHandlers = [
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
  GetCardWithChildrenQueryHandler,
];

import {
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetCardWithChildrenQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
} from './get-card.handler';

export const QueryHandlers = [
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
  GetCardWithChildrenQueryHandler,
];

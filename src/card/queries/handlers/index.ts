import {
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
  GetCardWithChildrenQueryHandler,
} from './get-card.handler';

export const QueryHandlers = [
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
  GetCardWithChildrenQueryHandler,
];

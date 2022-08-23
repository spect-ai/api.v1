import {
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
  GetCardWithChildrenQueryHandler,
  GetCardByFilterQueryHandler,
} from './get-card.handler';

export const QueryHandlers = [
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
  GetCardWithChildrenQueryHandler,
  GetCardByFilterQueryHandler,
];

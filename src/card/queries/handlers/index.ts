import {
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetCardWithChildrenQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
  GetCardByFilterQueryHandler,
  GetMultipleCardsWithChildrenByFilterQueryHandler,
} from './get-card.handler';

export const QueryHandlers = [
  GetCardByIdQueryHandler,
  GetMultipleCardsByIdsQueryHandler,
  GetCardBySlugQueryHandler,
  GetCardWithChildrenQueryHandler,
  GetMultipleCardsWithChildrenQueryHandler,
  GetCardByFilterQueryHandler,
  GetMultipleCardsWithChildrenByFilterQueryHandler,
];

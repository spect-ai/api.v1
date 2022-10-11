import {
  GetCircleNavigationBreadcrumbsQueryHandler,
  GetCircleNavigationQueryHandler,
} from './get-circle-nav.handler';
import {
  GetCircleByFilterQueryHandler,
  GetCircleByIdQueryHandler,
  GetCircleBySlugQueryHandler,
  GetCircleWithAllRelationsQueryHandler,
  GetCircleWithChildrenQueryHandler,
  GetMultipleCirclesQueryHandler,
} from './get-circle.handler';

export const QueryHandlers = [
  GetCircleByIdQueryHandler,
  GetCircleBySlugQueryHandler,
  GetMultipleCirclesQueryHandler,
  GetCircleByFilterQueryHandler,
  GetCircleWithChildrenQueryHandler,
  GetCircleWithAllRelationsQueryHandler,
  GetCircleNavigationQueryHandler,
  GetCircleNavigationBreadcrumbsQueryHandler,
];

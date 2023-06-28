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
  GetCirclesByFilterQueryHandler,
  GetMultipleCirclesQueryHandler,
} from './get-circle.handler';
import { GetPrivateCircleByCircleIdQueryHandler } from './get-private-circle.handler';

export const QueryHandlers = [
  GetCircleByIdQueryHandler,
  GetCircleBySlugQueryHandler,
  GetMultipleCirclesQueryHandler,
  GetCircleByFilterQueryHandler,
  GetCirclesByFilterQueryHandler,
  GetCircleWithChildrenQueryHandler,
  GetCircleWithAllRelationsQueryHandler,
  GetCircleNavigationQueryHandler,
  GetCircleNavigationBreadcrumbsQueryHandler,
  GetPrivateCircleByCircleIdQueryHandler,
];

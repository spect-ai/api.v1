import {
  GetCircleByFilterQueryHandler,
  GetCircleByIdQueryHandler,
  GetCircleBySlugQueryHandler,
  GetMultipleCirclesQueryHandler,
} from './get-circle.handler';

export const QueryHandlers = [
  GetCircleByIdQueryHandler,
  GetCircleBySlugQueryHandler,
  GetMultipleCirclesQueryHandler,
  GetCircleByFilterQueryHandler,
];

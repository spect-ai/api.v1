import {
  GetProjectBySlugQueryHandler,
  GetProjectByIdQueryHandler,
} from './get-project.handler';

export const QueryHandlers = [
  GetProjectByIdQueryHandler,
  GetProjectBySlugQueryHandler,
];

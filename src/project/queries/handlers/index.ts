import {
  GetProjectBySlugQueryHandler,
  GetProjectByIdQueryHandler,
  GetMultipleProjectsQueryHandler,
} from './get-project.handler';

export const QueryHandlers = [
  GetProjectByIdQueryHandler,
  GetProjectBySlugQueryHandler,
  GetMultipleProjectsQueryHandler,
];

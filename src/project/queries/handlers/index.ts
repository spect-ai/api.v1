import {
  GetProjectBySlugQueryHandler,
  GetProjectByIdQueryHandler,
  GetMultipleProjectsQueryHandler,
  GetDetailedProjectQueryHandler,
  GetDetailedProjectBySlugQueryHandler,
} from './get-project.handler';

export const QueryHandlers = [
  GetProjectByIdQueryHandler,
  GetProjectBySlugQueryHandler,
  GetMultipleProjectsQueryHandler,
  GetDetailedProjectQueryHandler,
  GetDetailedProjectBySlugQueryHandler,
];

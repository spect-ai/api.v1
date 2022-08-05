import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { GetProjectByIdQuery, GetProjectBySlugQuery } from '../impl';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';

@QueryHandler(GetProjectByIdQuery)
export class GetProjectByIdQueryHandler
  implements IQueryHandler<GetProjectByIdQuery>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetProjectByIdQueryHandler');
  }

  async execute(query: GetProjectByIdQuery): Promise<Project> {
    try {
      const project = await this.projectRepository.getProjectById(
        query.id,
        query.customPopulate,
        query.selectedFields,
      );
      return project;
    } catch (error) {
      console.log(this.logger);
      this.logger.error(
        `Failed while getting project using id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting project using id',
        error.message,
      );
    }
  }
}

@QueryHandler(GetProjectBySlugQuery)
export class GetProjectBySlugQueryHandler
  implements IQueryHandler<GetProjectBySlugQuery>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly logger: LoggingService,
  ) {}

  async execute(query: GetProjectBySlugQuery): Promise<Project> {
    try {
      const project = await this.projectRepository.getProjectBySlug(
        query.slug,
        query.customPopulate,
        query.selectedFields,
      );
      return project;
    } catch (error) {
      console.log(this.logger);
      this.logger.error(
        `Failed while getting project using slug with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting project using slug',
        error.message,
      );
    }
  }
}

import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import {
  GetDetailedProjectByIdQuery,
  GetDetailedProjectBySlugQuery,
  GetMultipleProjectsQuery,
  GetProjectByIdQuery,
  GetProjectBySlugQuery,
} from '../impl';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { MappedItem } from 'src/common/interfaces';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CardsProjectService } from 'src/project/cards.project.service';

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

@QueryHandler(GetMultipleProjectsQuery)
export class GetMultipleProjectsQueryHandler
  implements IQueryHandler<GetMultipleProjectsQuery>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(
    query: GetMultipleProjectsQuery,
  ): Promise<Project[] | MappedItem<Project>> {
    try {
      const projects = await this.projectRepository.getMultipleProjects(
        query.filter,
        query.customPopulate,
        query.selectedFields,
      );
      if (query.objectify) {
        return this.commonTools.objectify(projects, 'id');
      }
      return projects;
    } catch (error) {
      this.logger.error(
        `Failed while getting multiple projects with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting multiple projects',
        error.message,
      );
    }
  }
}

@QueryHandler(GetDetailedProjectByIdQuery)
export class GetDetailedProjectQueryHandler
  implements IQueryHandler<GetDetailedProjectByIdQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly cardsProjectService: CardsProjectService,
  ) {}

  async execute(
    query: GetDetailedProjectByIdQuery,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project = await this.queryBus.execute(
        new GetProjectByIdQuery(query.id),
      );

      return this.cardsProjectService.projectPopulatedWithCardDetails(project);
    } catch (error) {
      this.logger.error(
        `Failed while getting detailed project by id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting detailed project by id',
        error.message,
      );
    }
  }
}

@QueryHandler(GetDetailedProjectBySlugQuery)
export class GetDetailedProjectBySlugQueryHandler
  implements IQueryHandler<GetDetailedProjectBySlugQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly cardsProjectService: CardsProjectService,
  ) {}

  async execute(
    query: GetDetailedProjectBySlugQuery,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project = await this.queryBus.execute(
        new GetProjectBySlugQuery(query.slug),
      );

      return this.cardsProjectService.projectPopulatedWithCardDetails(project);
    } catch (error) {
      this.logger.error(
        `Failed while getting detailed project by id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting detailed project by id',
        error.message,
      );
    }
  }
}

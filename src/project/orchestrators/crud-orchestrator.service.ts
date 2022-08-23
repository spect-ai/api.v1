import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardsProjectService } from '../cards.project.service';
import { DetailedProjectResponseDto } from '../dto/detailed-project-response.dto';
import { GetProjectByIdQuery, GetProjectBySlugQuery } from '../queries/impl';

@Injectable()
export class CrudOrchestrator {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
    private readonly cardsProjectService: CardsProjectService,
  ) {
    logger.setContext('ProjectV1Service');
  }

  async getDetailedProject(id: string): Promise<DetailedProjectResponseDto> {
    try {
      const project = await this.queryBus.execute(new GetProjectByIdQuery(id));

      return this.cardsProjectService.projectPopulatedWithCardDetails(project);
    } catch (error) {
      this.logger.logError(
        `Failed while getting project by id with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while getting project by id',
        error.message,
      );
    }
  }

  async getDetailedProjectBySlug(
    slug: string,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project = await this.queryBus.execute(
        new GetProjectBySlugQuery(slug),
      );

      return this.cardsProjectService.projectPopulatedWithCardDetails(project);
    } catch (error) {
      this.logger.logError(
        `Failed while getting project by slug with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while getting project by slug',
        error.message,
      );
    }
  }
}

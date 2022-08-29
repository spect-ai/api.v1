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
    logger.setContext('ProjectCrudOrchestrator');
  }
}

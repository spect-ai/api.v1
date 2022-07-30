import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import {
  GetCircleBySlugQuery,
  GetCircleByIdQuery,
} from '../impl/get-circle.query';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';

@QueryHandler(GetCircleByIdQuery)
export class GetCircleByIdQueryHandler
  implements IQueryHandler<GetCircleByIdQuery>
{
  constructor(
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetCircleByIdQueryHandler');
  }

  async execute(query: GetCircleByIdQuery): Promise<DetailedCircleResponseDto> {
    try {
      return await this.circleRepository.getCircleById(
        query.id,
        query.customPopulate,
        query.selectedFields,
      );
    } catch (error) {
      console.log(this.logger);
      this.logger.error(
        `Failed while getting circle using id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting circle using id',
        error.message,
      );
    }
  }
}

@QueryHandler(GetCircleBySlugQuery)
export class GetCircleBySlugQueryHandler
  implements IQueryHandler<GetCircleBySlugQuery>
{
  constructor(
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetCircleBySlugQueryHandler');
  }

  async execute(
    query: GetCircleBySlugQuery,
  ): Promise<DetailedCircleResponseDto> {
    try {
      return await this.circleRepository.getCircleBySlug(
        query.slug,
        query.customPopulate,
        query.selectedFields,
      );
    } catch (error) {
      this.logger.logError(
        `Failed while getting circle using slug with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting circle using slug',
        error.message,
      );
    }
  }
}

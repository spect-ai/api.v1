import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import {
  DetailedCircleResponseDto,
  CircleResponseDto,
} from 'src/circle/dto/detailed-circle-response.dto';
import {
  GetCircleBySlugQuery,
  GetCircleByIdQuery,
  GetMultipleCirclesQuery,
  GetCircleByFilterQuery,
  GetCircleWithChildrenQuery,
  GetCircleWithAllRelationsQuery,
} from '../impl/get-circle.query';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';
import { Circle, ExtendedCircle } from 'src/circle/model/circle.model';
import { GetPrivateCircleByCircleIdQuery } from '../impl';
import { CirclesPrivateRepository } from 'src/circle/circles-private.repository';
import { CirclePrivate } from 'src/circle/model/circle-private.model';

@QueryHandler(GetPrivateCircleByCircleIdQuery)
export class GetPrivateCircleByCircleIdQueryHandler
  implements IQueryHandler<GetPrivateCircleByCircleIdQuery>
{
  constructor(
    private readonly circlePrivateRepository: CirclesPrivateRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetPrivateCircleByCircleIdQueryHandler');
  }

  async execute(
    query: GetPrivateCircleByCircleIdQuery,
  ): Promise<CirclePrivate> {
    try {
      return await this.circlePrivateRepository.findOne({ circleId: query.id });
    } catch (error) {
      this.logger.error(
        `Failed while getting private circle using id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting private circle using id',
        error.message,
      );
    }
  }
}

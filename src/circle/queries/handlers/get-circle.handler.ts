import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
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

@QueryHandler(GetMultipleCirclesQuery)
export class GetMultipleCirclesQueryHandler
  implements IQueryHandler<GetMultipleCirclesQuery>
{
  constructor(
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetMultipleCirclesQueryHandler');
  }

  async execute(
    query: GetMultipleCirclesQuery,
  ): Promise<DetailedCircleResponseDto[]> {
    try {
      return await this.circleRepository.getCircles(
        query.filterQuery,
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

@QueryHandler(GetCircleByFilterQuery)
export class GetCircleByFilterQueryHandler
  implements IQueryHandler<GetCircleByFilterQuery>
{
  constructor(
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetCircleByFilterQueryHandler');
  }

  async execute(
    query: GetCircleByFilterQuery,
  ): Promise<DetailedCircleResponseDto> {
    try {
      return await this.circleRepository.getCircleByFilter(
        query.filterQuery,
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

@QueryHandler(GetCircleWithChildrenQuery)
export class GetCircleWithChildrenQueryHandler
  implements IQueryHandler<GetCircleWithChildrenQuery>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(query: GetCircleWithChildrenQuery): Promise<ExtendedCircle> {
    const { id, maxDepth } = query;
    const circles = await this.circlesRepository.getCircleWithAllChildren(
      id,
      maxDepth,
    );
    return circles;
  }
}

@QueryHandler(GetCircleWithAllRelationsQuery)
export class GetCircleWithAllRelationsQueryHandler
  implements IQueryHandler<GetCircleWithAllRelationsQuery>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(
    query: GetCircleWithAllRelationsQuery,
  ): Promise<ExtendedCircle> {
    const { id, maxChildrenDepth, maxParentsDepth } = query;
    const circles = await this.circlesRepository.getCircleWithAllRelations(
      id,
      maxChildrenDepth,
      maxParentsDepth,
    );
    return circles;
  }
}

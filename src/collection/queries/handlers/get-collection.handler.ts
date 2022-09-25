import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { LoggingService } from 'src/logging/logging.service';
import {
  GetCollectionByFilterQuery,
  GetCollectionByIdQuery,
  GetCollectionBySlugQuery,
  GetMultipleCollectionsQuery,
} from '../impl/get-collection.query';

@QueryHandler(GetCollectionByIdQuery)
export class GetCollectionByIdQueryHandler
  implements IQueryHandler<GetCollectionByIdQuery>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetCollectionByIdQueryHandler');
  }

  async execute(query: GetCollectionByIdQuery): Promise<Collection> {
    try {
      return await this.collectionRepository.getCollectionById(
        query.id,
        query.customPopulate,
        query.selectedFields,
      );
    } catch (error) {
      this.logger.error(
        `Failed while getting collection using id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting collection using id',
        error.message,
      );
    }
  }
}

@QueryHandler(GetMultipleCollectionsQuery)
export class GetMultipleCollectionsQueryHandler
  implements IQueryHandler<GetMultipleCollectionsQuery>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetMultipleCollectionsQueryHandler');
  }

  async execute(query: GetMultipleCollectionsQuery): Promise<Collection[]> {
    try {
      return await this.collectionRepository.getCollections(
        query.filterQuery,
        query.customPopulate,
        query.selectedFields,
      );
    } catch (error) {
      this.logger.logError(
        `Failed while getting multiple collections using filter with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting multiple collections using filter',
        error.message,
      );
    }
  }
}

@QueryHandler(GetCollectionBySlugQuery)
export class GetCollectionBySlugQueryHandler
  implements IQueryHandler<GetCollectionBySlugQuery>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetCollectionBySlugQueryHandler');
  }

  async execute(query: GetCollectionBySlugQuery): Promise<Collection> {
    try {
      return await this.collectionRepository.getCollectionBySlug(
        query.slug,
        query.customPopulate,
        query.selectedFields,
      );
    } catch (error) {
      this.logger.logError(
        `Failed while getting collection using slug with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting collection using slug',
        error.message,
      );
    }
  }
}

@QueryHandler(GetCollectionByFilterQuery)
export class GetCollectionByFilterQueryHandler
  implements IQueryHandler<GetCollectionByFilterQuery>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetCollectionByFilterQueryHandler');
  }

  async execute(query: GetCollectionByFilterQuery): Promise<Collection> {
    try {
      return await this.collectionRepository.getCollectionByFilter(
        query.filterQuery,
        query.customPopulate,
        query.selectedFields,
      );
    } catch (error) {
      this.logger.logError(
        `Failed while getting collection using filter with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting collection using filter',
        error.message,
      );
    }
  }
}

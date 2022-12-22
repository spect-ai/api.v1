import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Collection } from 'src/collection/model/collection.model';
import { LoggingService } from 'src/logging/logging.service';
import { RequestProvider } from 'src/users/user.provider';
import { CirclesRepository } from '../circles.repository';
import { GetCircleByIdQuery } from '../queries/impl';

@Injectable()
export class CirclesCollectionService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    logger.setContext('CirclesRolesService');
  }

  async getAllCollections(id: string): Promise<Collection[]> {
    try {
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(id, {
          collections: {
            name: 1,
            slug: 1,
            id: 1,
            active: 1,
            properties: 1,
            propertyOrder: 1,
            collectionType: 1,
          },
        }),
      );

      return circle.collections;
    } catch (error) {
      this.logger.logError(
        `Failed getting collections in circle with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed getting collections in circle',
        error.message,
      );
    }
  }
}

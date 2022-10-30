import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import {
  CollectionPublicResponseDto,
  CollectionResponseDto,
} from 'src/collection/dto/collection-response.dto';
import { Collection } from 'src/collection/model/collection.model';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { GetMultipleUsersByIdsQuery } from 'src/users/queries/impl';
import {
  GetCollectionByFilterQuery,
  GetCollectionByIdQuery,
  GetCollectionBySlugQuery,
  GetMultipleCollectionsQuery,
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
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

@QueryHandler(GetPublicViewCollectionQuery)
export class GetPublicViewCollectionQueryHandler
  implements IQueryHandler<GetPublicViewCollectionQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly advancedAccessService: AdvancedAccessService,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetPublicViewCollectionQueryHandler');
  }

  async execute(
    query: GetPublicViewCollectionQuery,
  ): Promise<CollectionPublicResponseDto> {
    try {
      const { caller, slug, collection } = query;
      let collectionToGet = collection;
      if (!collectionToGet) {
        collectionToGet = await this.queryBus.execute(
          new GetCollectionBySlugQuery(slug),
        );
      }
      if (!collectionToGet) {
        throw new Error('Collection not found');
      }

      const hasRole = await this.advancedAccessService.hasRoleToAccessForm(
        collectionToGet,
      );
      const hasPassedSybilCheck =
        await this.advancedAccessService.hasPassedSybilProtection(
          collectionToGet,
          caller,
        );
      const formHasCredentialsButUserIsntConnected =
        collectionToGet.mintkudosTokenId &&
        collectionToGet.mintkudosTokenId > 0 &&
        !caller;
      const canFillForm =
        hasRole &&
        !formHasCredentialsButUserIsntConnected &&
        hasPassedSybilCheck;

      const previousResponses = [];
      if (collectionToGet.dataOwner)
        for (const [dataSlug, owner] of Object.entries(
          collectionToGet.dataOwner,
        )) {
          if (owner === caller?.id) {
            previousResponses.push(collectionToGet.data[dataSlug]);
          }
        }

      const kudosClaimedByUser =
        collectionToGet.mintkudosClaimedBy &&
        collectionToGet.mintkudosClaimedBy.includes(caller?.id);
      const canClaimKudos =
        collectionToGet.mintkudosTokenId &&
        !kudosClaimedByUser &&
        collectionToGet.numOfKudos > collectionToGet.mintkudosClaimedBy?.length;
      const res =
        this.advancedAccessService.removePrivateFields(collectionToGet);
      return {
        ...res,
        canFillForm,
        canClaimKudos,
        previousResponses,
      };
    } catch (error) {
      this.logger.logError(
        `Failed while getting public collection with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting public collection',
        error.message,
      );
    }
  }
}

@QueryHandler(GetPrivateViewCollectionQuery)
export class GetPrivateViewCollectionQueryHandler
  implements IQueryHandler<GetPrivateViewCollectionQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetPrivateViewCollectionQueryHandler');
  }

  async execute(
    query: GetPrivateViewCollectionQuery,
  ): Promise<CollectionResponseDto> {
    try {
      const { slug, collection } = query;
      let collectionToGet = collection;
      if (!collectionToGet) {
        collectionToGet = await this.queryBus.execute(
          new GetCollectionBySlugQuery(slug),
        );
      }
      if (!collectionToGet) {
        throw new Error('Collection not found');
      }

      let profileInfo = [];
      if (collectionToGet.dataOwner) {
        const profiles = [];
        for (const [dataSlug, owner] of Object.entries(
          collectionToGet.dataOwner,
        )) {
          profiles.push(owner);
        }
        if (profiles.length > 0) {
          profileInfo = await this.queryBus.execute(
            new GetMultipleUsersByIdsQuery(profiles, null, {
              username: 1,
              avatar: 1,
              ethAddress: 1,
            }),
          );
        }
      }
      return {
        ...collectionToGet,
        profiles: this.commonTools.objectify(profileInfo, 'id'),
      };
    } catch (error) {
      this.logger.logError(
        `Failed while getting private collection with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting private collection',
        error.message,
      );
    }
  }
}

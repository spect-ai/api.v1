import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { CollectionPublicResponseDto } from 'src/collection/dto/collection-response.dto';
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
        caller,
      );
      const hasPassedSybilCheck =
        await this.advancedAccessService.hasPassedSybilProtection(
          collectionToGet,
          caller,
        );
      const formHasCredentialsButUserIsntConnected =
        collectionToGet.formMetadata.mintkudosTokenId &&
        collectionToGet.formMetadata.mintkudosTokenId > 0 &&
        !caller;

      const formRequiresDiscordButUserIsntConnected =
        collectionToGet.formMetadata.discordConnectionRequired &&
        !caller?.discordId;

      const canFillForm =
        hasRole &&
        !formHasCredentialsButUserIsntConnected &&
        hasPassedSybilCheck &&
        !formRequiresDiscordButUserIsntConnected;

      const previousResponses = [];
      if (collectionToGet.dataOwner)
        for (const [dataSlug, owner] of Object.entries(
          collectionToGet.dataOwner,
        )) {
          if (owner === caller?.id) {
            previousResponses.push({
              slug: dataSlug,
              ...collectionToGet.data[dataSlug],
            });
          }
        }
      const kudosClaimedByUser =
        collectionToGet.formMetadata.mintkudosClaimedBy &&
        collectionToGet.formMetadata.mintkudosClaimedBy.includes(caller?.id);
      const canClaimKudos =
        collectionToGet.formMetadata.mintkudosTokenId &&
        !kudosClaimedByUser &&
        collectionToGet.formMetadata.numOfKudos >
          (collectionToGet.formMetadata.mintkudosClaimedBy?.length || 0);
      let activityOrder, activity;
      if (previousResponses.length > 0) {
        const prevSlug = previousResponses[previousResponses.length - 1].slug;
        activityOrder = collectionToGet.dataActivityOrder[prevSlug];
        activity = collectionToGet.dataActivities[prevSlug];
      }
      const res =
        this.advancedAccessService.removePrivateFields(collectionToGet);

      return {
        ...res,
        formMetadata: {
          ...res.formMetadata,
          canFillForm,
          hasRole,
          canClaimKudos,
          hasPassedSybilCheck,
          previousResponses,
        },
        activity,
        activityOrder,
        kudosClaimedByUser,
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

  async execute(query: GetPrivateViewCollectionQuery): Promise<any> {
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

      // add __payment__ to properties if payment config is set
      if (collectionToGet.formMetadata?.paymentConfig) {
        collectionToGet.properties.__payment__ = {
          name: '__payment__',
          type: 'payWall',
          isPartOfFormView: false,
          internal: true,
        };
        collectionToGet.propertyOrder.push('__payment__');
      }

      if (collectionToGet.formMetadata?.ceramicEnabled) {
        collectionToGet.properties.__ceramic__ = {
          name: '__ceramic__',
          type: 'shortText',
          isPartOfFormView: false,
          internal: true,
        };
        collectionToGet.propertyOrder.push('__ceramic__');
      }

      if (collectionToGet.collectionType === 1) {
        collectionToGet.properties.__cardStatus__ = {
          name: '__cardStatus__',
          type: 'cardStatus',
          isPartOfFormView: false,
          internal: true,
        };
        collectionToGet.propertyOrder.push('__cardStatus__');
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

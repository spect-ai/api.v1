import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { CollectionPublicResponseDto } from 'src/collection/dto/collection-response.dto';
import { Collection } from 'src/collection/model/collection.model';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import { AdvancedConditionService } from 'src/collection/services/advanced-condition.service';
import {
  ClaimEligibilityService,
  ResponseCredentialingService,
} from 'src/collection/services/response-credentialing.service';
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
    this.logger.setContext('GetCollectionByFilterQueryHandler');
  }

  async execute(query: GetCollectionByFilterQuery): Promise<Collection> {
    try {
      return await this.collectionRepository.getCollectionByFilter(
        query.filterQuery,
        query.customPopulate,
        query.selectedFields,
      );
    } catch (error) {
      this.logger.error(
        `Failed while getting collection using filter with error: ${error}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting collection using filter',
        error,
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
    private readonly advancedConditionService: AdvancedConditionService,
    private readonly claimEligibilityService: ClaimEligibilityService,
  ) {
    logger.setContext('GetPublicViewCollectionQueryHandler');
  }

  findDataSlugOfResponse(collection: Collection, responder: string) {
    if (!collection.dataOwner || !responder) return;
    for (const [dataSlug, owner] of Object.entries(collection.dataOwner)) {
      if (owner === responder) {
        return dataSlug;
      }
    }
    return;
  }

  async execute(
    query: GetPublicViewCollectionQuery,
  ): Promise<CollectionPublicResponseDto> {
    const { caller, slug, collection } = query;

    try {
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
            previousResponses.push({
              slug: dataSlug,
              ...collectionToGet.data[dataSlug],
            });
          }
        }
      const canClaimResForKudos = this.claimEligibilityService.canClaimKudos(
        collectionToGet,
        caller?.id,
      );

      const canClaimSurveyToken = false;

      const canClaimResForPoap = this.claimEligibilityService.canClaimPoap(
        collectionToGet,
        caller?.id,
      );
      let activityOrder, activity;
      if (previousResponses.length > 0) {
        const prevSlug = previousResponses[previousResponses.length - 1].slug;
        activityOrder = collectionToGet.dataActivityOrder[prevSlug];
        activity = collectionToGet.dataActivities[prevSlug];
      }

      const transactionHashesOfUser =
        collectionToGet.formMetadata.transactionHashes?.[caller?.ethAddress];

      const res =
        this.advancedAccessService.removePrivateFields(collectionToGet);

      return {
        ...res,
        formMetadata: {
          ...res.formMetadata,
          canFillForm,
          hasRole,
          canClaimKudos: canClaimResForKudos.canClaim,
          hasPassedSybilCheck,
          previousResponses,
          canClaimSurveyToken,
          transactionHashesOfUser,
          canClaimPoap: canClaimResForPoap.canClaim,
          hasClaimedKudos: canClaimResForKudos.hasClaimed,
          matchCountForPoap: canClaimResForPoap.matchCount,
          matchCountForKudos: canClaimResForKudos.matchCount,
        },
        activity,
        activityOrder,
      };
    } catch (error) {
      this.logger.logError(
        `Failed while getting public collection with id ${collection?.id} with error: ${error.message}`,
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
    const { slug, collection } = query;

    try {
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
          name: 'Payment',
          id: '__payment__',
          type: 'payWall',
          isPartOfFormView: false,
          internal: true,
        };
        collectionToGet.propertyOrder.push('__payment__');
      }

      if (collectionToGet.formMetadata?.ceramicEnabled) {
        collectionToGet.properties.__ceramic__ = {
          name: 'Ceramic Stream',
          id: '__ceramic__',
          type: 'shortText',
          isPartOfFormView: false,
          internal: true,
        };
        collectionToGet.propertyOrder.push('__ceramic__');
      }

      if (collectionToGet.collectionType === 1) {
        collectionToGet.properties.__cardStatus__ = {
          name: 'Card Status',
          id: '__cardStatus__',
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
              bio: 1,
              skillsV2: 1,
              id: 1,
              website: 1,
              twitter: 1,
              github: 1,
              behance: 1,
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
        `Failed while getting private collection with slug ${
          slug || collection?.slug
        } error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting private collection',
        error.message,
      );
    }
  }
}

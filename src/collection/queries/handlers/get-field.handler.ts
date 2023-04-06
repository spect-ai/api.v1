import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { HasSatisfiedDataConditionsQuery } from 'src/automation/queries/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import { ClaimEligibilityService } from 'src/collection/services/response-credentialing.service';
import { CommonTools } from 'src/common/common.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { GitcoinPassportService } from 'src/credentials/services/gitcoin-passport.service';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { PoapService } from 'src/credentials/services/poap.service';
import { LoggingService } from 'src/logging/logging.service';
import { LookupRepository } from 'src/lookup/lookup.repository';
import { GetUserByFilterQuery } from 'src/users/queries/impl';
import {
  GetCollectionByFilterQuery,
  GetCollectionBySlugQuery,
} from '../impl/get-collection.query';
import { GetNextFieldQuery } from '../impl/get-field.query';

@QueryHandler(GetNextFieldQuery)
export class GetNextFieldQueryHandler
  implements IQueryHandler<GetNextFieldQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
    private readonly lookupRepository: LookupRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly advancedAccessService: AdvancedAccessService,
    private readonly gitcoinPassportService: GitcoinPassportService,
    private readonly guildService: GuildxyzService,
    private readonly poapService: PoapService,
    private readonly kudosService: MintKudosService,
    private readonly claimEligibilityService: ClaimEligibilityService,
  ) {
    this.logger.setContext('GetNextFieldQueryHandler');
  }

  async fetchNextValidFieldFromCollection(
    collection: Collection,
    draftSubmittedByUser: any,
    discordId: string,
  ): Promise<{
    field: string;
    ethAddress?: string;
  }> {
    const { properties, propertyOrder } = collection;

    if (
      collection.formMetadata.captchaEnabled &&
      !draftSubmittedByUser?.hasPassedCaptcha
    ) {
      return {
        field: 'captcha',
      };
    }

    let user;
    if (collection.formMetadata.pageOrder.includes('connect')) {
      console.log({ discordId });
      try {
        user = await this.queryBus.execute(
          new GetUserByFilterQuery(
            {
              discordId,
            },
            '',
            true,
          ),
        );
        if (!user || !user?.ethAddress) {
          return {
            field: 'connectWallet',
            ethAddress: null,
          };
        }
      } catch (e) {
        return {
          field: 'connectWallet',
          ethAddress: null,
        };
      }
    }

    if (
      collection.formMetadata.sybilProtectionEnabled &&
      !draftSubmittedByUser?.hasPassedSybilCheck
    ) {
      const hasPassedSybilCheck =
        await this.advancedAccessService.hasPassedSybilProtection(
          collection,
          user,
        );
      if (!hasPassedSybilCheck) {
        return {
          field: 'sybilProtection',
          ethAddress: user.ethAddress,
        };
      }
    }

    if (
      collection.formMetadata.formRoleGating?.length &&
      !draftSubmittedByUser?.hasPassedRoleGating
    ) {
      const hasRoleToAccessForm =
        await this.advancedAccessService.hasRoleToAccessForm(collection, user);
      if (!hasRoleToAccessForm) {
        return {
          field: 'roleGating',
          ethAddress: user.ethAddress,
        };
      }
    }
    for (const page of collection.formMetadata.pageOrder) {
      for (const propertyId of collection.formMetadata.pages[page].properties) {
        console.log({ propertyId });

        if (!draftSubmittedByUser)
          return {
            field: propertyId,
            ethAddress: user?.ethAddress,
          };
        const property = properties[propertyId];
        if (!property.isPartOfFormView) continue;
        if (draftSubmittedByUser[propertyId]) {
          continue;
        } else if (property.viewConditions) {
          const viewConditions = property.viewConditions;
          const satisfied = await this.queryBus.execute(
            new HasSatisfiedDataConditionsQuery(
              collection,
              draftSubmittedByUser,
              viewConditions,
            ),
          );
          if (satisfied) {
            return {
              field: propertyId,
              ethAddress: user?.ethAddress,
            };
          }
        } else
          return {
            field: propertyId,
            ethAddress: user?.ethAddress,
          };
      }
    }

    if (
      collection.formMetadata.paymentConfig &&
      !draftSubmittedByUser?.paymentConfig
    ) {
      return {
        field: 'paywall',
        ethAddress: user?.ethAddress,
      };
    }

    if (
      collection.formMetadata.poapEventId &&
      collection.formMetadata.poapEditCode &&
      !draftSubmittedByUser?.hasClaimedPoap
    ) {
      return {
        field: 'poap',
        ethAddress: user?.ethAddress,
      };
    }

    if (
      collection.formMetadata.mintkudosTokenId &&
      !draftSubmittedByUser?.hasClaimedKudos
    ) {
      return {
        field: 'kudos',
        ethAddress: user?.ethAddress,
      };
    }

    if (
      collection.formMetadata.surveyTokenId &&
      !draftSubmittedByUser?.hasClaimedSurveyToken
    ) {
      return {
        field: 'erc20',
        ethAddress: user?.ethAddress,
      };
    }

    return {
      field: 'readonlyAtEnd',
      ethAddress: user?.ethAddress,
    };
  }

  async populateMemberDetails(collection: Collection, userIds?: string[]) {
    const circle = await this.queryBus.execute(
      new GetCircleByIdQuery(collection.parents[0], {
        members: {
          username: 1,
          ethAddress: 1,
          id: 1,
        },
      }),
    );
    let populatedMemberDetails = [];
    if (userIds) {
      const memberDetails = this.commonTools.objectify(circle.members, 'id');
      for (const userId of userIds) {
        const member = memberDetails[userId];
        if (member) {
          populatedMemberDetails.push(member);
        }
      }
    } else {
      populatedMemberDetails = circle.members;
    }
    return populatedMemberDetails;
  }

  async sybilScores(collection: Collection, callerAddress: string) {
    const stamps =
      await this.gitcoinPassportService.getDetailedPassportStampsWithTotalScore(
        callerAddress,
        collection.formMetadata.sybilProtectionScores,
      );
    return stamps;
  }

  async guildUrl(collection: Collection) {
    const circle = await this.queryBus.execute(
      new GetCircleByIdQuery(collection.parents[0]),
    );
    const guild = await this.guildService.getGuild(circle.guildxyzId);
    return `https://guild.xyz/${guild.urlName}`;
  }

  async poap(collection: Collection, callerId: string) {
    const canClaimResForPoap = this.claimEligibilityService.canClaimPoap(
      collection,
      callerId,
    );
    const { poap, claimed: hasClaimed } = await this.poapService.getPoapById(
      collection.formMetadata.poapEventId,
    );
    return {
      canClaim: canClaimResForPoap,
      hasClaimed,
      poap,
      responseCount:
        collection.formMetadata.minimumNumberOfAnswersThatNeedToMatchForPoap,
    };
  }
  async kudos(collection: Collection, callerId: string) {
    const res = this.claimEligibilityService.canClaimKudos(
      collection,
      callerId,
    );
    const kudos = await this.kudosService.getKudosById(
      collection.formMetadata.mintkudosTokenId,
    );
    return {
      canClaim: res.canClaim,
      hasClaimed: res.hasClaimed,
      kudos,
      responseCount:
        collection.formMetadata
          .minimumNumberOfAnswersThatNeedToMatchForMintkudos,
    };
  }

  async erc20(collection: Collection, callerAddress: string) {
    const res = await this.claimEligibilityService.canClaimErc20(
      collection,
      callerAddress,
    );
    return {
      canClaim: res.canClaim,
      hasClaimed: res.hasClaimed,
      surveyToken: collection.formMetadata.surveyToken,
      surveyChain: collection.formMetadata.surveyChain,
    };
  }

  async execute(query: GetNextFieldQuery): Promise<any> {
    const {
      slug,
      collection: collectionToFetch,
      callerId,
      discordChannelId,
      callerIdType,
      populateData,
    } = query;
    try {
      let collection = collectionToFetch;
      if (!collection && slug) {
        collection = await this.queryBus.execute(
          new GetCollectionBySlugQuery(slug),
        );
      }
      if (!collection && discordChannelId) {
        const lookedUpData = await this.lookupRepository.findOne({
          key: discordChannelId,
          keyType: 'discordThreadId',
        });
        if (!lookedUpData?.collectionId)
          throw 'Collection hasnt been indexed with the given threadId';
        collection = await this.collectionRepository.findById(
          lookedUpData.collectionId,
        );
      }
      if (!collection) {
        throw new NotFoundException('Collection not found');
      }
      const draftSubmittedByUser =
        collection.formMetadata.drafts &&
        collection.formMetadata.drafts[callerId];

      const { field: nextField, ethAddress: callerAddress } =
        await this.fetchNextValidFieldFromCollection(
          collection,
          draftSubmittedByUser,
          callerId,
        );

      console.log({ populateData });
      if (!populateData) {
        return {
          type: nextField,
          name: nextField === 'readonlyAtEnd' ? 'readonlyAtEnd' : 'nextField',
        };
      }
      if (nextField) {
        if (nextField === 'readonlyAtEnd')
          return {
            readonly: true,
            readonlyValue: collection.formMetadata.messageOnSubmission,
            name: 'readonlyAtEnd',
            type: 'readonly',
          };
        else if (nextField === 'connectWallet') {
          return {
            type: 'connectWallet',
            name: 'Please connect wallet to continue',
          };
        } else if (nextField === 'sybilProtection') {
          return {
            type: 'sybilProtection',
            name: 'Please complete the sybil protection to continue',
            detailedScores: await this.sybilScores(collection, callerAddress),
          };
        } else if (nextField === 'roleGating') {
          return {
            type: 'roleGating',
            name: 'Please complete the role gating to continue',
            guildRoles: collection.formMetadata.formRoleGating,
            guildUrl: await this.guildUrl(collection),
          };
        } else if (nextField === 'captcha') {
          return {
            type: 'captcha',
            name: 'Please complete the captcha to continue',
          };
        } else if (nextField === 'paywall') {
          return {
            type: 'paywall',
            name: 'Please complete the paywall to continue',
          };
        } else if (nextField === 'poap') {
          return {
            type: 'poap',
            name: `You're eligible for a POAP!`,
            poap: await this.poap(collection, callerId),
          };
        } else if (nextField === 'kudos') {
          return {
            type: 'kudos',
            name: 'You are eligible for a Kudos!',
            kudos: await this.kudos(collection, callerId),
          };
        } else if (nextField === 'erc20') {
          return {
            type: 'erc20',
            name: 'You are eligible for an ERC20 token!',
            erc20: await this.erc20(collection, callerAddress),
          };
        }

        if (
          ['user', 'user[]'].includes(collection.properties[nextField].type)
        ) {
          const populatedMemberDetails = await this.populateMemberDetails(
            collection,
          );
          collection.properties[nextField].options = populatedMemberDetails;
        }

        return collection.properties[nextField];
      }
      return null;
    } catch (err) {
      this.logger.logError(`Error in GetNextFieldQueryHandler ${err}`);
      throw err;
    }
  }
}

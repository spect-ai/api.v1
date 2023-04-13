import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { HasSatisfiedDataConditionsQuery } from 'src/automation/queries/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import { ClaimEligibilityService } from 'src/collection/services/response-credentialing.service';
import { Option, Property } from 'src/collection/types/types';
import { CommonTools } from 'src/common/common.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { GitcoinPassportService } from 'src/credentials/services/gitcoin-passport.service';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { PoapService } from 'src/credentials/services/poap.service';
import { LoggingService } from 'src/logging/logging.service';
import { LookupRepository } from 'src/lookup/lookup.repository';
import { TokenDetails } from 'src/registry/model/registry.model';
import { RegistryService } from 'src/registry/registry.service';
import { GetUserByFilterQuery } from 'src/users/queries/impl';
import {
  GetCollectionByFilterQuery,
  GetCollectionBySlugQuery,
} from '../impl/get-collection.query';
import { GetNextFieldQuery } from '../impl/get-field.query';
import { v4 as uuidv4 } from 'uuid';

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
    private readonly registryService: RegistryService,
  ) {
    this.logger.setContext('GetNextFieldQueryHandler');
  }

  rewardFieldCompleted(
    propertyId: string,
    draftSubmittedByUser: any,
    collection: Collection,
  ) {
    if (collection.properties[propertyId].type !== 'reward') return true;
    const reward = draftSubmittedByUser[propertyId];
    if (reward.chain && reward.token && reward.value) return true;
    return false;
  }

  fetchIncompleteRewardField(value: any) {
    if (!value?.chain) {
      return 'chain';
    } else if (!value?.token) return 'token';
    else if (!value?.value) {
      return 'value';
    }
    return null;
  }

  async addOptionIdsToLookup(
    options: Option[],
    collection: Collection,
    idLookup?: { [key: string]: any },
  ) {
    const lookupUpdates = {};
    const returnedOptions = [];
    options.forEach((option) => {
      lookupUpdates[option.value] = option;

      returnedOptions.push({
        ...option,
        id: option.value,
      });
    });

    const idLookupUpdates = {
      ...(idLookup || collection.formMetadata.idLookup || {}),
      ...lookupUpdates,
    };
    await this.collectionRepository.updateById(collection.id, {
      formMetadata: {
        ...collection.formMetadata,
        idLookup: idLookupUpdates,
      },
    });

    return { returnedOptions, idLookupUpdates };
  }

  async addFieldsToLookup(
    property: {
      name: string;
    },
    collection: Collection,
    idLookup?: { [key: string]: any },
  ) {
    const idLookupsVals = Object.values(collection.formMetadata.idLookup || {});
    const propNameIdx = idLookupsVals.indexOf(property.name);
    if (propNameIdx !== -1)
      return {
        id: Object.keys(collection.formMetadata.idLookup || {})[propNameIdx],
        updatedLookups: collection.formMetadata.idLookup,
      };

    const id = uuidv4();
    const updatedLookups = {
      ...(idLookup || collection.formMetadata.idLookup || {}),
      [id]: property.name,
    };
    await this.collectionRepository.updateById(collection.id, {
      formMetadata: {
        ...collection.formMetadata,
        idLookup: updatedLookups,
      },
    });

    return { id, updatedLookups };
  }

  async fetchNextValidFieldFromCollection(
    collection: Collection,
    discordId: string,
    draftSubmittedByUser: any,
  ): Promise<{
    field: string;
    ethAddress?: string;
    subField?: string;
  }> {
    const { properties, propertyOrder } = collection;
    const updates = {} as { [key: string]: any };
    if (
      collection.formMetadata.captchaEnabled &&
      !draftSubmittedByUser.captcha
    ) {
      return {
        field: 'captcha',
      };
    }

    let user;
    if (collection.formMetadata.pageOrder.includes('connect')) {
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
        updates['connectWallet'] = user.ethAddress;
      } catch (e) {
        return {
          field: 'connectWallet',
          ethAddress: null,
        };
      }
    }

    if (
      collection.formMetadata.sybilProtectionEnabled &&
      !draftSubmittedByUser.hasPassedSybilCheck &&
      !collection.formMetadata.drafts?.[discordId]?.['sybilProtection']
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
      updates['sybilProtection'] = true;
    }

    if (
      collection.formMetadata.formRoleGating?.length &&
      !draftSubmittedByUser.hasPassedRoleGating &&
      !collection.formMetadata.drafts?.[discordId]?.['roleGating']
    ) {
      const hasRoleToAccessForm =
        await this.advancedAccessService.hasRoleToAccessForm(collection, user);
      if (!hasRoleToAccessForm) {
        return {
          field: 'roleGating',
          ethAddress: user.ethAddress,
        };
      }
      updates['roleGating'] = true;
    }

    // TODO: This is BAD. Need to refactor this so we dont do writes on get calls. It is necessary now to prevent long wait times while checking for sybil, role etc
    if (Object.keys(updates).length) {
      await this.collectionRepository.updateById(collection.id, {
        formMetadata: {
          ...collection.formMetadata,
          drafts: {
            ...(collection.formMetadata.drafts || {}),
            [discordId]: {
              ...(collection.formMetadata.drafts?.[discordId] || {}),
              ...updates,
            },
          },
        },
      });
    }
    for (const page of collection.formMetadata.pageOrder) {
      for (const propertyId of collection.formMetadata.pages[page].properties) {
        if (
          collection.formMetadata.skippedFormFields?.[discordId]?.[propertyId]
        )
          continue;

        const property = properties[propertyId];
        if (!property.isPartOfFormView) continue;

        if (
          draftSubmittedByUser[propertyId] &&
          this.rewardFieldCompleted(
            propertyId,
            draftSubmittedByUser,
            collection,
          )
        ) {
          continue;
        } else {
          let satisfied = true;
          if (property.viewConditions) {
            const viewConditions = property.viewConditions;
            satisfied = await this.queryBus.execute(
              new HasSatisfiedDataConditionsQuery(
                collection,
                draftSubmittedByUser,
                viewConditions,
              ),
            );
          }
          if (satisfied) {
            if (collection.properties[propertyId].type === 'reward') {
              const incompleteField = this.fetchIncompleteRewardField(
                draftSubmittedByUser[propertyId],
              );
              if (incompleteField) {
                return {
                  field: propertyId,
                  ethAddress: user?.ethAddress,
                  subField: incompleteField,
                };
              }
            }

            return {
              field: propertyId,
              ethAddress: user?.ethAddress,
            };
          }
        }
      }
    }

    if (
      collection.formMetadata.paymentConfig &&
      !draftSubmittedByUser?.__payment__ &&
      !collection.formMetadata.skippedFormFields?.[discordId]?.['paywall']
    ) {
      return {
        field: 'paywall',
        ethAddress: user?.ethAddress,
      };
    }

    if (
      collection.formMetadata.poapEventId &&
      collection.formMetadata.poapEditCode &&
      !collection.formMetadata?.drafts?.[discordId]?.['poapClaimed']
    ) {
      return {
        field: 'poap',
        ethAddress: user?.ethAddress,
      };
    }

    if (
      collection.formMetadata.mintkudosTokenId &&
      !collection.formMetadata?.drafts?.[discordId]?.['kudosClaimed']
    ) {
      return {
        field: 'kudos',
        ethAddress: user?.ethAddress,
      };
    }

    if (
      collection.formMetadata.surveyTokenId &&
      !collection.formMetadata?.drafts?.[discordId]?.['erc20Claimed']
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
          populatedMemberDetails.push({
            value: member.id,
            label: member.username,
          });
        }
      }
    } else {
      populatedMemberDetails = circle.members.map((member) => ({
        value: member.id,
        label: member.username,
      }));
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

  async poap(collection: Collection, callerId: string, callerAddress: string) {
    const canClaimResForPoap = this.claimEligibilityService.canClaimPoap(
      collection,
      callerId,
    );
    const poap = await this.poapService.getPoapById(
      collection.formMetadata.poapEventId,
      callerAddress,
    );
    return {
      canClaim: canClaimResForPoap.canClaim && !poap.hasClaimed,
      responseMatchCount: canClaimResForPoap.matchCount,
      hasClaimed: poap.hasClaimed,
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
      responseMatchCount: res.matchCount,
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
      token: collection.formMetadata.surveyToken,
      chain: collection.formMetadata.surveyChain,
      value: res.value,
      reason: res.reason,
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
        (collection.formMetadata.drafts &&
          collection.formMetadata.drafts[callerId]) ||
        {};

      const {
        field: nextField,
        ethAddress: callerAddress,
        subField,
      } = await this.fetchNextValidFieldFromCollection(
        collection,
        callerId,
        draftSubmittedByUser,
      );

      if (!populateData) {
        return {
          type: collection.properties[nextField]?.type || nextField,
          name: nextField === 'readonlyAtEnd' ? 'readonlyAtEnd' : nextField,
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
          const paywallField = {
            type: 'paywall',
            name: 'paywall',
            paymentConfig: collection.formMetadata.paymentConfig,
          };
          const res = await this.addFieldsToLookup(paywallField, collection);
          return {
            ...paywallField,
            id: res.id,
          };
        } else if (nextField === 'poap') {
          return {
            type: 'poap',
            name: `You're eligible for a POAP!`,
            poap: await this.poap(collection, callerId, callerAddress),
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
        const returnedField = collection.properties[nextField];
        const lookupAdditionRes = await this.addFieldsToLookup(
          returnedField,
          collection,
        );
        returnedField.id = lookupAdditionRes.id;
        if (['user', 'user[]'].includes(returnedField.type)) {
          const populatedMemberDetails = await this.populateMemberDetails(
            collection,
          );
          returnedField.options = populatedMemberDetails;
        }
        if (['reward'].includes(returnedField.type)) {
          returnedField['subField'] = subField;
          if (subField === 'chain') {
            returnedField.options = Object.values(
              returnedField.rewardOptions,
            ).map((chain) => {
              return {
                label: chain.name,
                value: chain.chainId,
              };
            });
          } else if (subField === 'token') {
            const tokens = returnedField.rewardOptions[
              returnedField.type === 'reward'
                ? draftSubmittedByUser[nextField].chain?.value
                : draftSubmittedByUser[nextField].reward.chain?.value
            ].tokenDetails as TokenDetails;
            returnedField.options = Object.values(tokens).map((token) => {
              return {
                label: token.name,
                value: token.address,
              };
            });
          }
        }
        if (['singleSelect'].includes(returnedField.type)) {
          if (returnedField.allowCustom) {
            returnedField.options.push({
              label: 'Other',
              value: 'other',
            });
          }
        }

        if (
          ['reward', 'user', 'user[]', 'singleSelect', 'multiSelect'].includes(
            returnedField.type,
          )
        ) {
          if (returnedField.options) {
            const res = await this.addOptionIdsToLookup(
              returnedField.options,
              collection,
              lookupAdditionRes.updatedLookups,
            );
            returnedField.options = res.returnedOptions;
          }
        }
        return returnedField;
      }
      return null;
    } catch (err) {
      this.logger.logError(`Error in GetNextFieldQueryHandler ${err}`);
      throw err;
    }
  }
}

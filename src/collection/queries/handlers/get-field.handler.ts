import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { HasSatisfiedAdvancedDataConditionsQuery } from 'src/automation/queries/impl';
import { CirclesPrivateRepository } from 'src/circle/circles-private.repository';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import { ClaimEligibilityService } from 'src/collection/services/response-credentialing.service';
import { Option, Property, PropertyType } from 'src/collection/types/types';
import { CommonTools } from 'src/common/common.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { GitcoinPassportService } from 'src/credentials/services/gitcoin-passport.service';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { PoapService } from 'src/credentials/services/poap.service';
import { ZealyService } from 'src/credentials/services/zealy.service';
import { LoggingService } from 'src/logging/logging.service';
import { LookupRepository } from 'src/lookup/lookup.repository';
import { TokenDetails } from 'src/registry/model/registry.model';
import { RegistryService } from 'src/registry/registry.service';
import { GetUserByFilterQuery } from 'src/users/queries/impl';
import { v4 as uuidv4 } from 'uuid';
import { GetCollectionBySlugQuery } from '../impl/get-collection.query';
import { GetNextFieldQuery } from '../impl/get-field.query';
import { isAddress } from 'ethers/lib/utils';

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
    private readonly zealyService: ZealyService,
    private readonly circlePrivateRepository: CirclesPrivateRepository,
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
    callerId: string,
    property: Partial<Property>,
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
        draftNextField: {
          ...(collection.formMetadata.draftNextField || {}),
          [callerId]: property.id,
        },
      },
    });

    return { returnedOptions, idLookupUpdates };
  }

  async addFieldsToLookup(
    property: Partial<Property>,
    collection: Collection,
    callerId: string,
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
        draftNextField: {
          ...(collection.formMetadata.draftNextField || {}),
          [callerId]: property.id,
        },
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
    userId?: string;
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
        const query = {
          discordId,
        };
        if (
          collection.formMetadata.drafts?.[discordId]?.['connectWallet'] &&
          isAddress(
            collection.formMetadata.drafts?.[discordId]?.['connectWallet'],
          )
        ) {
          query['ethAddress'] =
            collection.formMetadata.drafts?.[discordId]?.['connectWallet'];
        }
        user = await this.queryBus.execute(new GetUserByFilterQuery(query, ''));
        console.log({ e: user?.ethAddress });
        if (!user?.ethAddress) {
          return {
            field: 'connectWallet',
            ethAddress: null,
          };
        } else if (
          !collection.formMetadata.drafts?.[discordId]?.['connectWallet']
        )
          return {
            field: 'connectWallet',
            ethAddress: user.ethAddress,
          };
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
      !collection.formMetadata.drafts?.[discordId]?.['sybilProtection'] &&
      !collection.formMetadata.drafts?.[discordId]?.saved
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
      !collection.formMetadata.drafts?.[discordId]?.['roleGating'] &&
      !collection.formMetadata.drafts?.[discordId]?.saved
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

    if (
      collection.formMetadata.discordRoleGating?.length &&
      !draftSubmittedByUser.hasPassedDiscordRoleGating &&
      !collection.formMetadata.drafts?.[discordId]?.['discordRoleGating'] &&
      !collection.formMetadata.drafts?.[discordId]?.saved
    ) {
      const hasRoleToAccessForm =
        await this.advancedAccessService.hasDiscordRoleToAccessForm(
          collection,
          discordId,
        );
      if (!hasRoleToAccessForm) {
        return {
          field: 'discordRoleGating',
          ethAddress: user?.ethAddress,
        };
      }
      updates['discordRoleGating'] = true;
    }
    if (Object.keys(updates).length) {
      // TODO: This is BAD. Need to refactor this so we dont do writes on get calls. It is necessary now to prevent long wait times while checking for sybil, role etc
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

    if (!collection.formMetadata.drafts?.[discordId]?.saved)
      for (const page of collection.formMetadata.pageOrder) {
        for (const propertyId of collection.formMetadata.pages[page]
          .properties) {
          if (
            collection.formMetadata.skippedFormFields?.[discordId]?.[propertyId]
          )
            continue;

          const property = properties[propertyId];
          if (
            !property.isPartOfFormView ||
            ['milestone', 'multiURL'].includes(property.type)
          )
            continue;
          if (
            draftSubmittedByUser.hasOwnProperty(propertyId) &&
            this.rewardFieldCompleted(
              propertyId,
              draftSubmittedByUser,
              collection,
            )
          ) {
            continue;
          } else {
            let satisfied = true;
            if (property.advancedConditions) {
              satisfied = await this.queryBus.execute(
                new HasSatisfiedAdvancedDataConditionsQuery(
                  collection,
                  draftSubmittedByUser,
                  property.advancedConditions,
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
      !collection.formMetadata.skippedFormFields?.[discordId]?.['paywall'] &&
      !collection.formMetadata.drafts?.[discordId]?.saved
    ) {
      return {
        field: 'paywall',
        ethAddress: user?.ethAddress,
      };
    }

    if (
      collection.formMetadata.poapEventId &&
      collection.formMetadata.poapEditCode &&
      !collection.formMetadata?.drafts?.[discordId]?.['poapClaimed'] &&
      !collection.formMetadata.skippedFormFields?.[discordId]?.['poap']
    ) {
      return {
        field: 'poap',
        ethAddress: user?.ethAddress,
        userId: user?.id,
      };
    }

    if (
      collection.formMetadata.mintkudosTokenId &&
      !collection.formMetadata?.drafts?.[discordId]?.['kudosClaimed'] &&
      !collection.formMetadata.skippedFormFields?.[discordId]?.['kudos']
    ) {
      return {
        field: 'kudos',
        ethAddress: user?.ethAddress,
        userId: user?.id,
      };
    }

    console.log({ addr: user?.ethAddress });
    if (
      collection.formMetadata.zealyXP &&
      !collection.formMetadata?.drafts?.[discordId]?.['zealyClaimed'] &&
      !collection.formMetadata.skippedFormFields?.[discordId]?.['zealyXp']
    ) {
      return {
        field: 'zealyXp',
        ethAddress: user?.ethAddress,
        userId: user?.id,
      };
    }

    if (
      collection.formMetadata.surveyTokenId &&
      !collection.formMetadata?.drafts?.[discordId]?.['erc20Claimed'] &&
      !collection.formMetadata.skippedFormFields?.[discordId]?.['erc20']
    ) {
      return {
        field: 'erc20',
        ethAddress: user?.ethAddress,
        userId: user?.id,
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
    const stamps = await this.gitcoinPassportService.getScoreByEthAddress(
      callerAddress,
      collection.formMetadata.sybilProtectionScores,
      true,
      true,
      true,
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
    console.log({ canClaimResForPoap });
    const poap = await this.poapService.getPoapById(
      collection.formMetadata.poapEventId,
      callerAddress,
    );

    return {
      canClaim: canClaimResForPoap.canClaim && !poap.hasClaimed,
      responseMatchCount: canClaimResForPoap.matchCount,
      hasClaimed: poap.claimed,
      poap,
      responseMatchCountToQualify:
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
      responseMatchCountToQualify:
        collection.formMetadata
          .minimumNumberOfAnswersThatNeedToMatchForMintkudos,
    };
  }
  async zealyXp(
    collection: Collection,
    callerId: string,
    callerAddress: string,
    callerDiscordId: string,
  ) {
    let zealyUser;
    console.log({ callerAddress, p: collection.parents[0] });
    let circleId = collection.parents[0];
    if ((collection.parents[0] as any).id)
      circleId = (collection.parents[0] as any).id;
    try {
      zealyUser = await this.zealyService.getUser(
        circleId,
        null,
        callerAddress,
      );
    } catch (e) {
      console.log(e);
    }

    try {
      if (!zealyUser && callerDiscordId) {
        zealyUser = await this.zealyService.getUser(circleId, callerDiscordId);
      }
    } catch (e) {
      console.log(e);
    }

    console.log({ zealyUser });

    if (!zealyUser) {
      const privateCredentials = await this.circlePrivateRepository.findOne({
        circleId: circleId,
      });
      const zealySubdomain = privateCredentials?.zealySubdomain;
      return {
        canClaim: 0,
        hasClaimed: false,
        userExists: false,
        zealySubdomain,
      };
    }

    const res = this.claimEligibilityService.canClaimZealyXp(
      collection,
      callerId,
      zealyUser.id,
    );

    return {
      canClaim: res.canClaimXp,
      hasClaimed: res.hasClaimedXp,
      userExists: true,
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
          throw new HttpException(
            {
              errorCode: 10290,
              message: 'Collection hasnt been indexed with the given threadId',
            },
            HttpStatus.BAD_REQUEST,
          );

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
        userId,
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

      console.log({ nextField });
      if (nextField) {
        if (
          ![
            'paywall',
            'user',
            'user[]',
            'singleSelect',
            'multiSelect',
          ].includes(collection.properties[nextField]?.type)
        ) {
          await this.collectionRepository.updateById(collection.id, {
            formMetadata: {
              ...collection.formMetadata,
              draftNextField: {
                ...(collection.formMetadata.draftNextField || {}),
                [callerId]: nextField,
              },
            },
          });
        }
        if (nextField === 'readonlyAtEnd')
          return {
            readonly: true,
            readonlyValue: collection.formMetadata.messageOnSubmission,
            name: 'readonlyAtEnd',
            type: 'readonly',
            multipleResponseEnabled:
              collection.formMetadata.multipleResponsesAllowed,
            updateResponseEnabled:
              collection.formMetadata.updatingResponseAllowed,
          };
        else if (nextField === 'connectWallet') {
          return {
            type: 'connectWallet',
            name: callerAddress
              ? `You have previously connected your account with ethereum address ${callerAddress}`
              : 'Please connect wallet to continue',
            ethAddress: callerAddress,
          };
        } else if (nextField === 'sybilProtection') {
          return {
            type: 'sybilProtection',
            name: 'Please complete the sybil protection to continue',
            detailedScores: await this.sybilScores(collection, callerAddress),
            ethAddress: callerAddress,
          };
        } else if (nextField === 'roleGating') {
          return {
            type: 'roleGating',
            name: 'Please complete the role gating to continue',
            guildRoles: collection.formMetadata.formRoleGating,
            guildUrl: await this.guildUrl(collection),
            ethAddress: callerAddress,
          };
        } else if (nextField === 'discordRoleGating') {
          return {
            type: 'discordRoleGating',
            name: 'Please complete the role gating to continue',
            guildRoles: collection.formMetadata.discordRoleGating,
          };
        } else if (nextField === 'captcha') {
          return {
            type: 'captcha',
            name: 'Please complete the captcha to continue',
          };
        } else if (nextField === 'paywall') {
          const paywallField = {
            type: 'paywall' as PropertyType,
            name: 'paywall',
            paymentConfig: collection.formMetadata.paymentConfig,
          };
          const res = await this.addFieldsToLookup(
            paywallField,
            collection,
            callerId,
          );
          return {
            ...paywallField,
            id: res.id,
          };
        } else if (nextField === 'poap') {
          return {
            type: 'poap',
            name: `You're eligible for a POAP!`,
            poap: await this.poap(collection, userId, callerAddress),
          };
        } else if (nextField === 'kudos') {
          return {
            type: 'kudos',
            name: 'You are eligible for a Kudos!',
            kudos: await this.kudos(collection, userId),
          };
        } else if (nextField === 'erc20') {
          return {
            type: 'erc20',
            name: 'You are eligible for an ERC20 token!',
            erc20: await this.erc20(collection, callerAddress),
          };
        } else if (nextField === 'zealyXp') {
          return {
            type: 'zealyXp',
            name: 'You are eligible for Zealy XP!',
            zealyXp: await this.zealyXp(
              collection,
              userId,
              callerAddress,
              callerId,
            ),
          };
        }
        const returnedField = collection.properties[nextField];
        // const lookupAdditionRes = await this.addFieldsToLookup(
        //   returnedField,
        //   collection,
        // );
        // returnedField.id = lookupAdditionRes.id;
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
        if (
          ['reward', 'user', 'user[]', 'singleSelect', 'multiSelect'].includes(
            returnedField.type,
          )
        ) {
          if (returnedField.options) {
            const res = await this.addOptionIdsToLookup(
              returnedField.options,
              collection,
              callerId,
              returnedField,
              // lookupAdditionRes.updatedLookups,
            );
            returnedField.options = res.returnedOptions;
          }
        }
        return returnedField;
      }
      return null;
    } catch (err) {
      this.logger.logError(
        `Error while getting next field in collection slug: ${slug}, callerId: ${callerId}, discord channel id: ${discordChannelId}, error: ${err}`,
      );
      throw err;
    }
  }
}

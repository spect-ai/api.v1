import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { BigNumber, ethers } from 'ethers';
import { surveyHubAbi } from 'src/common/abis/surveyHub';
import { GasPredictionService } from 'src/common/gas-prediction.service';
import { CreatePOAPDto } from 'src/credentials/dto/create-credential.dto';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { PoapService } from 'src/credentials/services/poap.service';
import { SurveyTokenService } from 'src/credentials/services/survey-token.service';
import { LoggingService } from 'src/logging/logging.service';
import { LookupRepository } from 'src/lookup/lookup.repository';
import { RegistryService } from 'src/registry/registry.service';
import { GetUserByFilterQuery } from 'src/users/queries/impl';
import { RequestProvider } from 'src/users/user.provider';
import { CollectionRepository } from '../collection.repository';
import { Collection } from '../model/collection.model';
import { GetCollectionByIdQuery } from '../queries';
import { SurveyTokenDistributionInfo } from '../types/types';
import { AdvancedConditionService } from './advanced-condition.service';
import { GetCollectionService } from './get-collection.service';
import { ZealyService } from 'src/credentials/services/zealy.service';
import { User } from 'src/users/model/users.model';

@Injectable()
export class ClaimEligibilityService {
  constructor(
    private readonly advancedConditionService: AdvancedConditionService,
    private readonly registryService: RegistryService,
    private readonly surveyTokenService: SurveyTokenService,
    private readonly zealyService: ZealyService,
    private readonly collectionRepository: CollectionRepository,
  ) {}

  canClaimKudos(
    collection: Collection,
    claimee: string,
  ): {
    canClaim: boolean;
    hasClaimed: boolean;
    reason: string;
    matchCount?: number;
  } {
    console.log({ claimee });
    if (!collection.formMetadata.mintkudosTokenId)
      return {
        canClaim: false,
        hasClaimed: false,
        reason: 'Kudos doesnt exist',
      };
    if (!claimee) {
      return {
        canClaim: false,
        hasClaimed: false,
        reason: 'User not logged in',
      };
    }

    if (
      collection.formMetadata.mintkudosClaimedBy &&
      collection.formMetadata.mintkudosClaimedBy.includes(claimee)
    ) {
      return {
        canClaim: false,
        hasClaimed: true,
        reason: 'User already claimed this kudos',
      };
    }

    let slug;
    for (const [dataSlug, owner] of Object.entries(
      collection.dataOwner || {},
    )) {
      if (owner === claimee) {
        slug = dataSlug;
        break;
      }
    }

    if (!slug) {
      return {
        canClaim: false,
        hasClaimed: false,
        reason: 'User has not submitted any response',
      };
    }

    let matchCount;
    if (
      collection.formMetadata
        ?.minimumNumberOfAnswersThatNeedToMatchForMintkudos > 0
    ) {
      const conditionRes =
        this.advancedConditionService.hasMetResponseCountCondition(
          collection,
          collection.data[slug],
          collection.formMetadata?.responseDataForMintkudos,
          collection.formMetadata
            ?.minimumNumberOfAnswersThatNeedToMatchForMintkudos,
        );
      matchCount = conditionRes.matchCount;
      if (!conditionRes.canClaim) {
        return {
          canClaim: false,
          hasClaimed: false,
          reason: 'User has not met the response count condition',
          matchCount,
        };
      }
    }

    return {
      canClaim: true,
      hasClaimed: false,
      reason: '',
      matchCount,
    };
  }

  canClaimPoap(
    collection: Collection,
    claimee: string,
  ): {
    canClaim: boolean;
    reason: string;
    matchCount?: number;
  } {
    if (!collection.formMetadata.poapEventId)
      return {
        canClaim: false,
        reason: 'POAP event doesnt exist',
      };
    if (!claimee) {
      return {
        canClaim: false,
        reason: 'User not logged in',
      };
    }
    let slug;
    for (const [dataSlug, owner] of Object.entries(
      collection.dataOwner || {},
    )) {
      if (owner === claimee) {
        slug = dataSlug;
        break;
      }
    }

    if (!slug)
      return {
        canClaim: false,
        reason: 'User has not submitted a response',
      };

    let matchCount;
    if (
      collection.formMetadata?.minimumNumberOfAnswersThatNeedToMatchForPoap > 0
    ) {
      const conditionRes =
        this.advancedConditionService.hasMetResponseCountCondition(
          collection,
          collection.data[slug],
          collection.formMetadata?.responseDataForPoap,
          collection.formMetadata?.minimumNumberOfAnswersThatNeedToMatchForPoap,
        );

      matchCount = conditionRes.matchCount;
      if (!conditionRes.canClaim) {
        return {
          canClaim: false,
          reason: 'User has not met the response count condition',
          matchCount,
        };
      }
    }
    return {
      canClaim: true,
      reason: '',
      matchCount,
    };
  }

  async canClaimErc20(
    collection: Collection,
    claimeeAddress: string,
  ): Promise<{
    canClaim: boolean;
    hasClaimed: boolean;
    reason: string;
    value?: number;
  }> {
    const registry = await this.registryService.getRegistry();
    const surveyChainId = collection.formMetadata.surveyChain?.value;
    const surveyId = collection.formMetadata.surveyTokenId;
    const distributionInfo =
      (await this.surveyTokenService.getSurveyDistributionInfo(
        surveyChainId,
        surveyId,
        registry,
      )) as SurveyTokenDistributionInfo;

    console.log({ distributionInfo });
    const balanceInEscrow = (await this.surveyTokenService.getEscrowBalance(
      surveyChainId,
      surveyId,
      registry,
    )) as BigNumber;
    console.log({ balanceInEscrow });
    const insufficientEscrowBalance =
      distributionInfo?.distributionType === 0
        ? balanceInEscrow.toString() === '0'
        : balanceInEscrow.lt(distributionInfo?.amountPerResponse || 0);

    const hasClaimed = await this.surveyTokenService.hasClaimedSurveyToken(
      surveyChainId,
      surveyId,
      claimeeAddress,
      registry,
    );
    console.log({ hasClaimed });
    const canClaim =
      !hasClaimed &&
      !insufficientEscrowBalance &&
      (await this.surveyTokenService.isEligibleToClaimSurveyToken(
        surveyChainId,
        surveyId,
        claimeeAddress,
        distributionInfo.distributionType,
        registry,
        distributionInfo.requestId?.toString(),
      ));
    console.log({ hasClaimed, canClaim });

    return {
      canClaim,
      hasClaimed,
      reason: '',
      value:
        distributionInfo?.distributionType === 0
          ? parseFloat(
              ethers.utils.formatEther(
                distributionInfo?.amountPerResponse.toString(),
              ),
            )
          : parseFloat(ethers.utils.formatEther(balanceInEscrow.toString())),
    };
  }

  canClaimZealyXp(
    collection: Collection,
    claimee: string,
    zealyUserId: string,
  ): {
    canClaimXp: number;
    hasClaimedXp?: boolean;
    reason: string;
  } {
    if (!collection.formMetadata.zealyXP)
      return {
        canClaimXp: 0,
        reason: 'Zealy Xp doesnt exist',
      };
    if (!claimee) {
      return {
        canClaimXp: 0,
        reason: 'User not logged in',
      };
    }

    if (collection.formMetadata.zealyClaimedBy?.includes(zealyUserId)) {
      return {
        canClaimXp: 0,
        hasClaimedXp: true,
        reason: 'User has already claimed XP',
      };
    }
    let slug;
    for (const [dataSlug, owner] of Object.entries(
      collection.dataOwner || {},
    )) {
      if (owner === claimee) {
        slug = dataSlug;
      }
    }

    if (!slug) {
      return {
        canClaimXp: 0,
        reason: 'User has not submitted any response',
      };
    }

    let totalClaimableXP = 0;
    if (
      Object.values(collection.formMetadata.zealyXpPerField || {}).some(
        (a) => a > 0,
      )
    )
      for (const [propertyId, correctResponse] of Object.entries(
        collection.formMetadata.responseDataForZealy || {},
      )) {
        const response = collection.data[slug][propertyId] as any;
        if (
          ['number', 'date'].includes(collection.properties[propertyId].type) &&
          response === correctResponse
        ) {
          totalClaimableXP +=
            collection.formMetadata.zealyXpPerField?.[propertyId] || 0;
        } else if (collection.properties[propertyId].type === 'singleSelect') {
          if (response?.value === correctResponse?.value) {
            totalClaimableXP +=
              collection.formMetadata.zealyXpPerField?.[propertyId || 0];
          }
        } else if (collection.properties[propertyId].type === 'multiSelect') {
          const responseDataValues = correctResponse?.map((v) => v?.value);
          const dataValues = response?.map((v) => v?.value);
          if (
            responseDataValues &&
            dataValues &&
            responseDataValues.length === dataValues.length &&
            responseDataValues.every((v) => dataValues.includes(v))
          ) {
            totalClaimableXP +=
              collection.formMetadata.zealyXpPerField?.[propertyId] || 0;
          }
        }
      }
    else if (collection.formMetadata.zealyXP) {
      totalClaimableXP = collection.formMetadata.zealyXP;
    } else {
      return {
        canClaimXp: 0,
        reason: 'No XP set for this collection',
      };
    }
    return {
      canClaimXp: totalClaimableXP,
      hasClaimedXp: false,
      reason: '',
    };
  }

  async canClaimZealy(
    collectionId: string,
    user: User,
  ): Promise<{
    canClaimXp: number;
    hasClaimedXp?: boolean;
    reason: string;
  }> {
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      let zealyUser;
      try {
        zealyUser = await this.zealyService.getUser(
          collection.parents[0],
          null,
          user.ethAddress,
        );
      } catch (e) {
        console.log({ e });
      }

      try {
        if (!zealyUser && user.discordId) {
          zealyUser = await this.zealyService.getUser(
            collection.parents[0],
            user.discordId,
            null,
          );
        }
      } catch (e) {
        console.log({ e });
      }

      if (!zealyUser) {
        throw new HttpException(
          {
            message: 'Zealy user not found',
            errorCode: 'ZEALY_USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return this.canClaimZealyXp(collection, user.id, zealyUser.id);
    } catch (e) {
      console.log({ e });
      throw e;
    }
  }
}

@Injectable()
export class ResponseCredentialingService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly requestProvider: RequestProvider,
    private readonly kudosService: MintKudosService,
    private readonly poapService: PoapService,
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly registryService: RegistryService,
    private readonly gasPredictionService: GasPredictionService,
    private readonly advancedConditionService: AdvancedConditionService,
    private readonly claimEligibilityService: ClaimEligibilityService,
    private readonly lookupRepository: LookupRepository,
    private readonly getCollectionService: GetCollectionService,
    private readonly zealyService: ZealyService,
  ) {
    this.logger.setContext('ResponseCredentialingService');
  }

  async airdropMintkudosToken(collectionId: string) {
    try {
      const collection = await this.queryBus.execute(
        new GetCollectionByIdQuery(collectionId),
      );
      if (!collection) {
        throw new InternalServerErrorException('Collection not found');
      }

      const { canClaim, reason } = this.claimEligibilityService.canClaimKudos(
        collection,
        this.requestProvider.user.id,
      );

      if (!canClaim) throw new InternalServerErrorException(reason);

      const operationId = await this.kudosService.airdropKudos(
        collection?.parents[0].id,
        collection.formMetadata.mintkudosTokenId,
        this.requestProvider.user.ethAddress,
      );
      if (operationId) {
        const mintkudosClaimedBy =
          collection.formMetadata.mintkudosClaimedBy || [];

        await this.collectionRepository.updateById(collection.id, {
          formMetadata: {
            ...collection.formMetadata,
            mintkudosClaimedBy: [
              ...mintkudosClaimedBy,
              this.requestProvider.user.id,
            ],
          },
        });
      }
      return { operationId };
    } catch (error) {
      this.logger.error(
        `Failed while airdropping kudos with error: ${error}`,
        collectionId,
      );
      throw error;
    }
  }

  async airdropSurveyToken(collectionId: string) {
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) {
        throw new InternalServerErrorException('Collection not found');
      }
      const registry = await this.registryService.getRegistry();
      const provider = new ethers.providers.JsonRpcProvider(
        registry[collection.formMetadata.surveyChain.value].provider,
      );
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      const surveyProtocol = new ethers.Contract(
        registry[collection.formMetadata.surveyChain.value].surveyHubAddress,
        surveyHubAbi,
        signer,
      );

      const paymentToken = await surveyProtocol.paymentToken(
        collection?.formMetadata?.surveyTokenId,
      );
      //const paymentToken = ethers.constants.AddressZero;

      const hasReceivedPayment = await surveyProtocol.hasReceivedPayment(
        collection?.formMetadata?.surveyTokenId,
        this.requestProvider.user.ethAddress,
      );
      //const hasReceivedPayment = false;
      if (hasReceivedPayment) {
        throw new InternalServerErrorException(
          'User has already received tokens',
        );
      }
      let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
      let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
      if (
        ['137', '80001'].includes(collection.formMetadata.surveyChain.value)
      ) {
        const feeEstimate = await this.gasPredictionService.predictGas(
          collection.formMetadata.surveyChain.value,
        );
        maxFeePerGas = ethers.utils.parseUnits(
          Math.ceil(feeEstimate.maxFee) + '',
          'gwei',
        );
        maxPriorityFeePerGas = ethers.utils.parseUnits(
          Math.ceil(feeEstimate.maxPriorityFee) + '',
          'gwei',
        );
      }
      let tx;
      if (paymentToken === ethers.constants.AddressZero) {
        const gasEstimate = await surveyProtocol.estimateGas.getPaidEther(
          collection?.formMetadata?.surveyTokenId,
          this.requestProvider.user.ethAddress,
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
          },
        );
        tx = await surveyProtocol.getPaidEther(
          collection?.formMetadata?.surveyTokenId,
          this.requestProvider.user.ethAddress,
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2),
          },
        );
      } else {
        const gasEstimate = await surveyProtocol.estimateGas.getPaidToken(
          collection?.formMetadata?.surveyTokenId,
          this.requestProvider.user.ethAddress,
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
          },
        );

        tx = await surveyProtocol.getPaidToken(
          collection?.formMetadata?.surveyTokenId,
          this.requestProvider.user.ethAddress,
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2),
          },
        );
      }

      await this.collectionRepository.updateById(collection.id, {
        formMetadata: {
          ...(collection.formMetadata || {}),
          transactionHashes: {
            [this.requestProvider.user.ethAddress]: {
              ...(collection.formMetadata.transactionHashes || {}),
              surveyTokenClaim: tx.hash,
            },
          },
        },
      });

      return { transactionHash: tx.hash };
    } catch (error) {
      this.logger.error(
        `Failed while airdropping tokens with error: ${error}`,
        collectionId,
      );
      throw new InternalServerErrorException(
        'Failed while airdropping tokens with error: ${error}',
        error.message,
      );
    }
  }

  async hasReceivedPaymentForResponse(surveyId: number, surveyProtocol: any) {
    const hasReceivedPayment = await surveyProtocol.hasReceivedPayment(
      surveyId,
      this.requestProvider.user.ethAddress,
    );
    return hasReceivedPayment;
  }

  async createPoap(
    collectionId: string,
    createPoapDto: CreatePOAPDto,
    image: Express.Multer.File,
  ) {
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) {
        throw new InternalServerErrorException('Collection not found');
      }
      const res = await this.poapService.createPoapEvent(createPoapDto, image);
      if (res.id) {
        await this.collectionRepository.updateById(collection.id, {
          formMetadata: {
            ...(collection.formMetadata || {}),
            poapEventId: res.id,
            poapEventEditCode: res.editCode,
          },
        });
      } else throw `Failed to create poap event`;
      return true;
    } catch (error) {
      this.logger.error(
        `Failed while creating poap with error: ${error}`,
        collectionId,
      );
      throw new InternalServerErrorException(
        `Failed while creating poap with error: ${error}`,
        error,
      );
    }
  }

  async claimPoap(collectionId: string) {
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) {
        throw new InternalServerErrorException('Collection not found');
      }

      const { canClaim, reason } = this.claimEligibilityService.canClaimPoap(
        collection,
        this.requestProvider.user.id,
      );
      if (!canClaim) {
        throw new InternalServerErrorException(reason);
      }

      const res = await this.poapService.claimPoap(
        collection.formMetadata.poapEventId,
        collection.formMetadata.poapEditCode,
        this.requestProvider.user.ethAddress,
      );
      return res;
    } catch (error) {
      this.logger.error(
        `Failed while claiming poap with error: ${error}`,
        collectionId,
      );
      throw new InternalServerErrorException(`${error}`);
    }
  }

  async claimZealyXp(collectionId: string) {
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) {
        throw new InternalServerErrorException('Collection not found');
      }

      let zealyUser;

      try {
        zealyUser = await this.zealyService.getUser(
          collection.parents[0],
          null,
          this.requestProvider.user.ethAddress,
        );
      } catch (e) {
        console.log(e);
      }

      try {
        if (!zealyUser && this.requestProvider.user.discordId) {
          zealyUser = await this.zealyService.getUser(
            collection.parents[0],
            this.requestProvider.user.discordId,
          );
        }
      } catch (e) {
        console.log(e);
      }

      if (!zealyUser) {
        throw new HttpException(
          {
            message: 'Zealy user not found',
            errorCode: 'ZEALY_USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const { canClaimXp, reason } =
        this.claimEligibilityService.canClaimZealyXp(
          collection,
          this.requestProvider.user.id,
          zealyUser.id,
        );
      if (!canClaimXp) {
        throw new InternalServerErrorException(reason);
      }

      const res = await this.zealyService.claimXp(
        collection.parents[0],
        zealyUser.id,
        canClaimXp,
        collection.name,
      );

      await this.collectionRepository.updateById(collection.id, {
        formMetadata: {
          ...(collection.formMetadata || {}),
          zealyClaimedBy: [
            ...(collection.formMetadata.zealyClaimedBy || []),
            zealyUser.id,
          ],
        },
      });

      return res;
    } catch (error) {
      this.logger.error(
        `Failed while claiming poap with error: ${error}`,
        collectionId,
      );
      throw new InternalServerErrorException(`${error}`);
    }
  }

  async claimZealyXpFromBot(discordId: string, threadId: string) {
    try {
      const collection = await this.getCollectionService.getCollectionFromAnyId(
        null,
        null,
        threadId,
        {},
      );

      const user = await this.queryBus.execute(
        new GetUserByFilterQuery(
          {
            discordId,
          },
          '',
          true,
        ),
      );

      if (!user) throw new Error('User not linked to discord');

      let zealyUser;
      try {
        zealyUser = await this.zealyService.getUser(
          collection.parents[0],
          discordId,
        );
      } catch (e) {
        console.log(e);
      }
      try {
        if (!zealyUser) {
          zealyUser = await this.zealyService.getUser(
            collection.parents[0],
            null,
            user.ethAddress,
          );
        }
      } catch (e) {
        console.log(e);
      }

      if (!zealyUser) {
        throw new HttpException(
          {
            message: 'Zealy user not found',
            errorCode: 'ZEALY_USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      const { canClaimXp, reason } =
        this.claimEligibilityService.canClaimZealyXp(
          collection,
          user.id,
          zealyUser.id,
        );
      if (!canClaimXp) {
        throw new InternalServerErrorException(reason);
      }

      const res = await this.zealyService.claimXp(
        collection.parents[0],
        zealyUser.id,
        canClaimXp,
        collection.name,
      );
      if (!res.id) throw new InternalServerErrorException(`Failed to claim xp`);

      await this.collectionRepository.updateById(collection.id, {
        formMetadata: {
          ...(collection.formMetadata || {}),
          drafts: {
            ...(collection.formMetadata.drafts || {}),
            [discordId]: {
              ...(collection.formMetadata.drafts?.[discordId] || {}),
              zealyClaimed: true,
            },
          },
          zealyClaimedBy: [
            ...(collection.formMetadata.zealyClaimedBy || []),
            zealyUser.id,
          ],
        },
      });

      return res;
    } catch (error) {
      this.logger.error(
        `Failed while claiming poap with error: ${error}`,
        threadId,
      );
      throw error;
    }
  }

  async claimPoapFromBot(discordId: string, threadId: string) {
    try {
      const collection = await this.getCollectionService.getCollectionFromAnyId(
        null,
        null,
        threadId,
        {},
      );

      const user = await this.queryBus.execute(
        new GetUserByFilterQuery(
          {
            discordId,
          },
          '',
          true,
        ),
      );
      if (!user || !user.ethAddress) {
        throw new NotFoundException('EthAddress of user not found');
      }

      const res = await this.poapService.claimPoap(
        collection.formMetadata.poapEventId,
        collection.formMetadata.poapEditCode,
        user.ethAddress,
      );
      if (!res.id)
        throw new InternalServerErrorException(`Failed to claim poap`);

      await this.collectionRepository.updateById(collection.id, {
        formMetadata: {
          ...(collection.formMetadata || {}),
          drafts: {
            ...(collection.formMetadata.drafts || {}),
            [discordId]: {
              ...(collection.formMetadata.drafts?.[discordId] || {}),
              poapClaimed: true,
            },
          },
        },
      });

      return res;
    } catch (error) {
      this.logger.error(
        `Failed while claiming poap with error: ${error}`,
        threadId,
      );
      throw error;
    }
  }

  async claimKudosFromBot(discordId: string, threadId: string) {
    try {
      const collection = await this.getCollectionService.getCollectionFromAnyId(
        null,
        null,
        threadId,
        {},
      );

      if (!collection.formMetadata.mintkudosTokenId)
        throw 'No mintkudos token id found';

      const user = await this.queryBus.execute(
        new GetUserByFilterQuery(
          {
            discordId,
          },
          '',
          true,
        ),
      );
      if (!user || !user.ethAddress) {
        throw new NotFoundException('EthAddress of user not found');
      }

      const operationId = await this.kudosService.airdropKudos(
        collection.parents[0],
        collection.formMetadata.mintkudosTokenId.toString(),
        user.ethAddress,
      );
      console.log({ operationId });
      if (!operationId)
        throw new InternalServerErrorException(`Failed to claim kudos`);

      await this.collectionRepository.updateById(collection.id, {
        formMetadata: {
          ...(collection.formMetadata || {}),
          drafts: {
            ...(collection.formMetadata.drafts || {}),
            [discordId]: {
              ...(collection.formMetadata.drafts?.[discordId] || {}),
              kudosClaimed: true,
            },
          },
          mintkudosClaimedBy: [
            ...(collection.formMetadata.mintkudosClaimedBy || []),
            user.id,
          ],
        },
      });

      return { operationId };
    } catch (error) {
      console.log({ error });
      this.logger.error(
        `Failed while claiming poap with error: ${error?.error || error}`,
        threadId,
      );
      throw new InternalServerErrorException(`${error?.error || error}`);
    }
  }

  async claimERC20FromBot(discordId: string, threadId: string) {
    try {
      const collection = await this.getCollectionService.getCollectionFromAnyId(
        null,
        null,
        threadId,
        {},
      );

      const user = await this.queryBus.execute(
        new GetUserByFilterQuery(
          {
            discordId,
          },
          '',
          true,
        ),
      );
      if (!user || !user.ethAddress) {
        throw new NotFoundException('EthAddress of user not found');
      }

      const registry = await this.registryService.getRegistry();
      const provider = new ethers.providers.JsonRpcProvider(
        registry[collection.formMetadata.surveyChain.value].provider,
      );
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      const surveyProtocol = new ethers.Contract(
        registry[collection.formMetadata.surveyChain.value].surveyHubAddress,
        surveyHubAbi,
        signer,
      );

      const paymentToken = await surveyProtocol.paymentToken(
        collection?.formMetadata?.surveyTokenId,
      );
      //const paymentToken = ethers.constants.AddressZero;

      const hasReceivedPayment = await surveyProtocol.hasReceivedPayment(
        collection?.formMetadata?.surveyTokenId,
        user.ethAddress,
      );
      //const hasReceivedPayment = false;
      if (hasReceivedPayment) {
        throw new InternalServerErrorException(
          'User has already received tokens',
        );
      }
      let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
      let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
      if (
        ['137', '80001'].includes(collection.formMetadata.surveyChain.value)
      ) {
        const feeEstimate = await this.gasPredictionService.predictGas(
          collection.formMetadata.surveyChain.value,
        );
        maxFeePerGas = ethers.utils.parseUnits(
          Math.ceil(feeEstimate.maxFee) + '',
          'gwei',
        );
        maxPriorityFeePerGas = ethers.utils.parseUnits(
          Math.ceil(feeEstimate.maxPriorityFee) + '',
          'gwei',
        );
      }
      let tx;
      if (paymentToken === ethers.constants.AddressZero) {
        const gasEstimate = await surveyProtocol.estimateGas.getPaidEther(
          collection?.formMetadata?.surveyTokenId,
          user.ethAddress,
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
          },
        );
        tx = await surveyProtocol.getPaidEther(
          collection?.formMetadata?.surveyTokenId,
          user.ethAddress,
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2),
          },
        );
      } else {
        const gasEstimate = await surveyProtocol.estimateGas.getPaidToken(
          collection?.formMetadata?.surveyTokenId,
          user.ethAddress,
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
          },
        );

        tx = await surveyProtocol.getPaidToken(
          collection?.formMetadata?.surveyTokenId,
          user.ethAddress,
          {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2),
          },
        );
      }

      await this.collectionRepository.updateById(collection.id, {
        formMetadata: {
          ...(collection.formMetadata || {}),
          transactionHashes: {
            [user.ethAddress]: {
              ...(collection.formMetadata.transactionHashes || {}),
              surveyTokenClaim: tx.hash,
            },
          },
          drafts: {
            ...(collection.formMetadata.drafts || {}),
            [discordId]: {
              ...(collection.formMetadata.drafts?.[discordId] || {}),
              erc20Claimed: true,
            },
          },
        },
      });

      return { transactionHash: tx.hash };
    } catch (error) {
      this.logger.error(
        `Failed while claiming poap with error: ${error}`,
        threadId,
      );
      throw error;
    }
  }
}

// TEMPFIX - Created this service without request provider so it can be called from handlers

@Injectable()
export class ResponseCredentialService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly kudosService: MintKudosService,
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly registryService: RegistryService,
    private readonly gasPredictionService: GasPredictionService,
  ) {
    this.logger.setContext('ResponseCredentialingService');
  }

  async airdropResponseReceiptNFT(
    responderAddress: string,
    collectionId?: string,
    collection?: Collection,
  ) {
    try {
      let collectionToUpdate = collection;
      if (!collectionToUpdate) {
        collectionToUpdate = await this.collectionRepository.findById(
          collectionId,
        );
      }
      if (!collectionToUpdate) {
        throw new InternalServerErrorException('Collection not found');
      }
      const registry = await this.registryService.getRegistry();

      const provider = new ethers.providers.JsonRpcProvider(
        registry[collectionToUpdate.formMetadata.surveyChain.value].provider,
      );
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      const surveyProtocol = new ethers.Contract(
        registry[
          collectionToUpdate.formMetadata.surveyChain.value
        ].surveyHubAddress,
        surveyHubAbi,
        signer,
      );

      const hasResponseReceiptNFT = await surveyProtocol.hasResponded(
        collectionToUpdate?.formMetadata?.surveyTokenId,
        responderAddress,
      );
      console.log({ hasResponseReceiptNFT });
      let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
      let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
      let tx;
      const gasEstimate = await surveyProtocol.estimateGas.addResponse(
        collectionToUpdate?.formMetadata?.surveyTokenId,
        responderAddress,
      );
      if (!hasResponseReceiptNFT) {
        const feeEstimate = await this.gasPredictionService.predictGas(
          collectionToUpdate.formMetadata.surveyChain.value,
        );
        console.log({ feeEstimate });
        if (
          ['137', '80001'].includes(
            collectionToUpdate.formMetadata.surveyChain.value,
          )
        ) {
          maxFeePerGas = ethers.utils.parseUnits(
            Math.ceil(feeEstimate.maxFee + 100) + '',
            'gwei',
          );
          maxPriorityFeePerGas = ethers.utils.parseUnits(
            Math.ceil(feeEstimate.maxPriorityFee + 25) + '',
            'gwei',
          );
        }

        tx = await surveyProtocol.addResponse(
          collectionToUpdate?.formMetadata?.surveyTokenId,
          responderAddress,
          {
            gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2),
            maxFeePerGas,
            maxPriorityFeePerGas,
          } as ethers.Overrides,
        );
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Failed while airdropping tokens with error: ${error}`,
        collectionId,
      );
      throw new InternalServerErrorException(
        'Failed while airdropping tokens with error: ${error}',
        error.message,
      );
    }
  }
}

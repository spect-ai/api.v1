import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ethers } from 'ethers';
import { surveyHubAbi } from 'src/common/abis/surveyHub';
import { GasPredictionService } from 'src/common/gas-prediction.service';
import { CreatePOAPDto } from 'src/credentials/dto/create-credential.dto';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { PoapService } from 'src/credentials/services/poap.service';
import { LoggingService } from 'src/logging/logging.service';
import { RegistryService } from 'src/registry/registry.service';
import { RequestProvider } from 'src/users/user.provider';
import { CollectionRepository } from '../collection.repository';
import { Collection } from '../model/collection.model';
import { GetCollectionByIdQuery } from '../queries';
import { AdvancedConditionService } from './advanced-condition.service';

@Injectable()
export class ClaimEligibilityService {
  constructor(
    private readonly advancedConditionService: AdvancedConditionService,
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
    if (
      collection.formMetadata
        ?.minimumNumberOfAnswersThatNeedToMatchForMintkudos > 0
    ) {
      const { canClaim, matchCount } =
        this.advancedConditionService.hasMetResponseCountCondition(
          collection,
          collection.data[slug],
          collection.formMetadata?.responseDataForMintkudos,
          collection.formMetadata
            ?.minimumNumberOfAnswersThatNeedToMatchForMintkudos,
        );

      if (!canClaim) {
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

    if (
      collection.formMetadata?.minimumNumberOfAnswersThatNeedToMatchForPoap > 0
    ) {
      const { canClaim, matchCount } =
        this.advancedConditionService.hasMetResponseCountCondition(
          collection,
          collection.data[slug],
          collection.formMetadata?.responseDataForPoap,
          collection.formMetadata?.minimumNumberOfAnswersThatNeedToMatchForPoap,
        );

      if (!canClaim) {
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
    };
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
        const mintkudosClaimedBy = collection.mintkudosClaimedBy || [];

        await this.collectionRepository.updateById(collection.id, {
          formMetadata: {
            ...(collection.formMetadata || {}),
            mintkudosClaimedBy: [
              ...mintkudosClaimedBy,
              this.requestProvider.user.id,
            ],
          },
        });
      }
      return operationId;
    } catch (error) {
      this.logger.error(
        `Failed while airdropping kudos with error: ${error}`,
        collectionId,
      );
      throw new InternalServerErrorException('${error}');
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

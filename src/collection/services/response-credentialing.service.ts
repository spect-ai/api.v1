import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ethers } from 'ethers';
import { surveyHubAbi } from 'src/common/abis/surveyHub';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { LoggingService } from 'src/logging/logging.service';
import { RegistryService } from 'src/registry/registry.service';
import { RequestProvider } from 'src/users/user.provider';
import { CollectionRepository } from '../collection.repository';
import { GetCollectionByIdQuery } from '../queries';

@Injectable()
export class ResponseCredentialingService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly requestProvider: RequestProvider,
    private readonly kudosService: MintKudosService,
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly registryService: RegistryService,
  ) {
    this.logger.setContext('ResponseCredentialingService');
    let contractAddress;
    // if (process.env.ENV === 'Development') {
    //   this.provider = new ethers.providers.JsonRpcProvider(
    //     'http://localhost:8545',
    //   );
    //   contractAddress = '0x68b1d87f95878fe05b998f19b66f4baba5de1aed';
    // } else {
    //   this.provider = new ethers.providers.AlchemyProvider(
    //     'matic',
    //     process.env.ALCHEMY_API_KEY_POLYGON,
    //   );
    //   contractAddress = '';
    // }

    // const signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

    // surveyProtocol = new ethers.Contract(
    //   contractAddress,
    //   surveyHubAbi,
    //   signer,
    // );
  }

  async airdropMintkudosToken(collectionId: string) {
    try {
      const collection = await this.queryBus.execute(
        new GetCollectionByIdQuery(collectionId),
      );
      if (!collection) {
        throw new InternalServerErrorException('Collection not found');
      }

      if (
        collection.mintkudosClaimedBy &&
        collection.mintkudosClaimedBy.includes(this.requestProvider.user.id)
      ) {
        throw new InternalServerErrorException(
          'User has already claimed kudos',
        );
      }

      if (
        !collection.dataOwner ||
        !Object.values(collection.dataOwner)?.includes(
          this.requestProvider.user.id,
        )
      ) {
        throw new InternalServerErrorException(
          'User has not submitted a response',
        );
      }

      const operationId = await this.kudosService.airdropKudos(
        collection?.parents[0].id,
        collection.formMetadata.mintkudosTokenId,
        this.requestProvider.user.ethAddress,
      );
      console.log('operationId', operationId);
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
      throw new InternalServerErrorException(
        'Failed while airdropping tokens with error: ${error}',
        error.message,
      );
    }
  }

  async airdropSurveyToken(collectionId: string) {
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) {
        throw new InternalServerErrorException('Collection not found');
      }
      const registry = await this.registryService.getRegistry();
      console.log({
        url: registry[collection.formMetadata.surveyTokenChainId].provider,
      });
      const provider = new ethers.providers.JsonRpcProvider(
        registry[collection.formMetadata.surveyTokenChainId].provider,
      );
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      const surveyProtocol = new ethers.Contract(
        registry[collection.formMetadata.surveyTokenChainId].surveyHubAddress,
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
      console.log(
        await surveyProtocol.escrowBalance(
          collection?.formMetadata?.surveyTokenId,
        ),
      );
      if (paymentToken === ethers.constants.AddressZero) {
        await surveyProtocol.oneClickResponseAndEarnEther(
          collection?.formMetadata?.surveyTokenId,
          this.requestProvider.user.ethAddress,
        );
      } else {
        await surveyProtocol.oneClickResponseAndEarnToken(
          collection?.formMetadata?.surveyTokenId,
          this.requestProvider.user.ethAddress,
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

  async hasReceivedPaymentForResponse(surveyId: number, surveyProtocol: any) {
    const hasReceivedPayment = await surveyProtocol.hasReceivedPayment(
      surveyId,
      this.requestProvider.user.ethAddress,
    );
    return hasReceivedPayment;
  }
}

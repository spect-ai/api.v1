import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { LoggingService } from 'src/logging/logging.service';
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
      console.log(error);
    }
  }
}

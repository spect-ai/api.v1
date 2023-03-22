import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { CollectionResponseDto } from 'src/collection/dto/collection-response.dto';
import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';
import { CollectionUpdatedEvent } from 'src/collection/events';
import { Collection } from 'src/collection/model/collection.model';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { CommonTools } from 'src/common/common.service';
import { PoapService } from 'src/credentials/services/poap.service';
import { LoggingService } from 'src/logging/logging.service';
import {
  UpdateCollectionByFilterCommand,
  UpdateCollectionCommand,
} from '../impl/update-collection.command';

@Injectable()
export class UpdateValidationService {
  constructor(
    private readonly logger: LoggingService,
    private readonly poapService: PoapService,
  ) {
    this.logger.setContext(UpdateValidationService.name);
  }

  async validateUpdateCollectionCommand(
    updateCollectionDto: Partial<UpdateCollectionDto>,
    collection: Collection,
  ): Promise<void> {
    if (!updateCollectionDto) {
      throw new Error('UpdateCollectionDto is required');
    }
    if (
      updateCollectionDto.formMetadata?.poapEventId &&
      collection.formMetadata?.poapEventId !==
        updateCollectionDto.formMetadata?.poapEventId
    ) {
      const isValidSecretCode = await this.poapService.validateSecretCode(
        updateCollectionDto.formMetadata.poapEventId,
        updateCollectionDto.formMetadata.poapEditCode,
      );

      if (!isValidSecretCode?.valid) {
        throw new Error('Invalid edit code');
      }
    }
  }
}

@CommandHandler(UpdateCollectionCommand)
export class UpdateCollectionCommandHandler
  implements ICommandHandler<UpdateCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly updateValidationService: UpdateValidationService,
  ) {
    this.logger.setContext(UpdateCollectionCommandHandler.name);
  }

  async execute(
    command: UpdateCollectionCommand,
  ): Promise<CollectionResponseDto> {
    try {
      const { updateCollectionDto, collectionId } = command;
      const collection = await this.collectionRepository.findById(collectionId);
      await this.updateValidationService.validateUpdateCollectionCommand(
        updateCollectionDto,
        collection,
      );
      let updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        updateCollectionDto,
      );
      if (
        updateCollectionDto.formMetadata?.walletConnectionRequired &&
        !updatedCollection.formMetadata.pages['connect']
      ) {
        const { formMetadata } = updatedCollection;
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            formMetadata: {
              ...formMetadata,
              pages: {
                ...formMetadata.pages,
                ['connect']: {
                  id: 'connect',
                  name: 'Connect Wallet',
                  properties: [],
                },
              },
              pageOrder: [
                ...formMetadata.pageOrder.slice(0, 1),
                'connect',
                ...formMetadata.pageOrder.slice(1),
              ],
            },
          },
        );
      }

      if (
        updateCollectionDto.formMetadata &&
        (updateCollectionDto.formMetadata.poapEventId ||
          updateCollectionDto.formMetadata.surveyTokenId ||
          updateCollectionDto.formMetadata.mintkudosTokenId) &&
        !updatedCollection.formMetadata.pages['collect']
      ) {
        const { formMetadata } = updatedCollection;
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            formMetadata: {
              ...formMetadata,
              pages: {
                ...formMetadata.pages,
                ['collect']: {
                  id: 'collect',
                  name: 'Collect incentives',
                  properties: [],
                },
              },
              // add the page just before "submitted" page
              pageOrder: [
                ...formMetadata.pageOrder.slice(0, -1),
                'collect',
                ...formMetadata.pageOrder.slice(-1),
              ],
            },
          },
        );
      }

      if (
        updateCollectionDto.formMetadata &&
        (updateCollectionDto.formMetadata.mintkudosTokenId === null ||
          updateCollectionDto.formMetadata.poapEventId === '') &&
        updatedCollection.formMetadata.pages['collect']
      ) {
        const { formMetadata } = updatedCollection;
        if (
          !collection.formMetadata.mintkudosTokenId &&
          !collection.formMetadata.poapEventId &&
          !collection.formMetadata.surveyTokenId
        ) {
          updatedCollection = await this.collectionRepository.updateById(
            collectionId,
            {
              formMetadata: {
                ...formMetadata,
                pages: {
                  ...formMetadata.pages,
                  collect: undefined,
                },
                // remove collect page
                pageOrder: formMetadata.pageOrder.filter(
                  (page) => page !== 'collect',
                ),
              },
            },
          );
        }
      }

      const pvtViewCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(null, updatedCollection),
      );
      this.eventBus.publish(
        new CollectionUpdatedEvent(pvtViewCollection, null, null),
      );
      return pvtViewCollection;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
    }
  }
}

@CommandHandler(UpdateCollectionByFilterCommand)
export class UpdateCollectionByFilterCommandHandler
  implements ICommandHandler<UpdateCollectionByFilterCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly updateValidationService: UpdateValidationService,
  ) {}

  async execute(
    command: UpdateCollectionByFilterCommand,
  ): Promise<CollectionResponseDto> {
    try {
      const { updateCollectionDto, filter } = command;
      const collection = await this.collectionRepository.findOne(filter);

      await this.updateValidationService.validateUpdateCollectionCommand(
        updateCollectionDto,
        collection,
      );
      const updatedCollection = await this.collectionRepository.updateByFilter(
        filter,
        updateCollectionDto,
      );
      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(null, updatedCollection),
      );
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
    }
  }
}

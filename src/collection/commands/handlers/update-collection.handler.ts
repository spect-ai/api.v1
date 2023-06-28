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
import {
  Collection,
  FormMetadata,
} from 'src/collection/model/collection.model';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { PoapService } from 'src/credentials/services/poap.service';
import { LoggingService } from 'src/logging/logging.service';
import {
  UpdateCollectionByFilterCommand,
  UpdateCollectionCommand,
} from '../impl/update-collection.command';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Circle } from 'src/circle/model/circle.model';

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
      const { formMetadata } = updateCollectionDto;
      const collection = await this.collectionRepository.findById(collectionId);
      if (
        collection.collectionType === 0 &&
        formMetadata &&
        (!formMetadata.pages || !formMetadata.pageOrder)
      ) {
        throw new InternalServerErrorException('Form metadata is invalid');
      }

      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      );

      if (formMetadata && formMetadata.paymentConfig) {
        const whitelistedAddresses = circle.whitelistedAddresses;
        Object.values(formMetadata.paymentConfig.networks).map((network) => {
          const receiverAddress = network.receiverAddress;
          if (
            !whitelistedAddresses[network.chainId].includes(receiverAddress)
          ) {
            throw new InternalServerErrorException({
              message: `Receiver address ${receiverAddress} is not whitelisted`,
            });
          }
        });
      }

      if (circle.pricingPlan === 0) {
        const pluginsCount = this.getPluginsCount(
          updateCollectionDto.formMetadata,
        );
        if (pluginsCount > 2) {
          throw new InternalServerErrorException({
            message: `You can only have 2 plugins per form in the free plan, upgrade to the premium plan to add unlimited plugins`,
          });
        }
      }

      await this.updateValidationService.validateUpdateCollectionCommand(
        updateCollectionDto,
        collection,
      );
      let updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        updateCollectionDto,
      );

      if (
        collection.collectionType === 0 &&
        formMetadata &&
        !formMetadata.pages['connect'] &&
        (formMetadata.sybilProtectionEnabled ||
          formMetadata.poapEditCode ||
          formMetadata.mintkudosTokenId ||
          formMetadata.surveyTokenId ||
          formMetadata.formRoleGating ||
          formMetadata.zealyXP > 0 ||
          !formMetadata.allowAnonymousResponses ||
          formMetadata.lookup?.tokens?.length ||
          formMetadata.lookup?.communities ||
          formMetadata.lookup?.verifiedAddress)
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
        collection.collectionType === 0 &&
        formMetadata &&
        formMetadata.pages['connect'] &&
        !formMetadata.sybilProtectionEnabled &&
        !formMetadata.poapEditCode &&
        !formMetadata.mintkudosTokenId &&
        !formMetadata.surveyTokenId &&
        !formMetadata.formRoleGating?.length &&
        !formMetadata.zealyXP &&
        formMetadata.allowAnonymousResponses &&
        !formMetadata.lookup?.tokens?.length &&
        !formMetadata.lookup?.communities &&
        !formMetadata.lookup?.verifiedAddress
      ) {
        const { formMetadata } = updatedCollection;
        delete formMetadata.pages['connect'];
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            formMetadata: {
              ...formMetadata,
              pages: {
                ...formMetadata.pages,
              },
              pageOrder: formMetadata.pageOrder.filter(
                (page) => page !== 'connect',
              ),
            },
          },
        );
      }

      console.log({ updateCollectionDto });
      if (
        updateCollectionDto.formMetadata &&
        (updateCollectionDto.formMetadata.poapEventId ||
          updateCollectionDto.formMetadata.surveyTokenId ||
          updateCollectionDto.formMetadata.mintkudosTokenId ||
          updateCollectionDto.formMetadata.zealyXP > 0) &&
        !updatedCollection.formMetadata.pages['collect']
      ) {
        console.log('adding collect page');
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
          updateCollectionDto.formMetadata.poapEventId === '' ||
          !updateCollectionDto.formMetadata.surveyTokenId ||
          !updateCollectionDto.formMetadata.zealyXP) &&
        updatedCollection.formMetadata.pages['collect']
      ) {
        console.log('maybe removing collect page');
        const { formMetadata } = updatedCollection;
        if (
          !formMetadata.mintkudosTokenId &&
          !formMetadata.poapEventId &&
          !formMetadata.surveyTokenId &&
          !formMetadata.zealyXP &&
          !formMetadata.surveyTokenId
        ) {
          console.log('removing collect page');
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

      if (
        collection.collectionType === 0 &&
        formMetadata &&
        !formMetadata.pages['connectDiscord'] &&
        formMetadata.discordRoleGating?.length
      ) {
        const { formMetadata } = updatedCollection;
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            formMetadata: {
              ...formMetadata,
              pages: {
                ...formMetadata.pages,
                ['connectDiscord']: {
                  id: 'connectDiscord',
                  name: 'Connect Discord',
                  properties: [],
                },
              },
              pageOrder: [
                ...formMetadata.pageOrder.slice(0, 1),
                'connectDiscord',
                ...formMetadata.pageOrder.slice(1),
              ],
            },
          },
        );
      }

      if (
        collection.collectionType === 0 &&
        formMetadata &&
        formMetadata.pages['connectDiscord'] &&
        !formMetadata.discordRoleGating?.length
      ) {
        const { formMetadata } = updatedCollection;
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            formMetadata: {
              ...formMetadata,
              pages: {
                ...formMetadata.pages,
                ['connectDiscord']: undefined,
              },
              pageOrder: formMetadata.pageOrder.filter(
                (page) => page !== 'connectDiscord',
              ),
            },
          },
        );
      }

      const pvtViewCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(updatedCollection.slug),
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

  getPluginsCount(formMetadata: FormMetadata): number {
    let pluginsCount = 0;
    Object.keys(formMetadata).map((prop) => {
      if (prop === 'sybilProtectionEnabled' && formMetadata[prop]) {
        pluginsCount++;
      } else if (prop === 'poapEditCode' && formMetadata[prop]) {
        pluginsCount++;
      } else if (prop === 'mintkudosTokenId' && formMetadata[prop]) {
        pluginsCount++;
      } else if (prop === 'surveyTokenId' && formMetadata[prop]) {
        pluginsCount++;
      } else if (prop === 'formRoleGating' && formMetadata[prop]?.length) {
        pluginsCount++;
      } else if (prop === 'discordRoleGating' && formMetadata[prop]?.length) {
        pluginsCount++;
      } else if (prop === 'zealyXP' && formMetadata[prop] > 0) {
        pluginsCount++;
      } else if (prop === 'allowAnonymousResponses' && !formMetadata[prop]) {
        pluginsCount++;
      } else if (prop === 'paymentConfig' && formMetadata[prop]) {
        pluginsCount++;
      } else if (prop === 'discordConfig' && formMetadata[prop]) {
        pluginsCount++;
      } else if (prop === 'captchaEnabled' && formMetadata[prop]) {
        pluginsCount++;
      }
    });
    return pluginsCount;
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
        new GetPrivateViewCollectionQuery(updatedCollection.slug),
      );
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
    }
  }
}

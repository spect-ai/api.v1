import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { SocialsDto } from 'src/collection/dto/socials.dto';
import { GetNextFieldQuery } from 'src/collection/queries';
import { ResponseCredentialService } from 'src/collection/services/response-credentialing.service';
import { Property } from 'src/collection/types/types';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { DiscordService } from 'src/common/discord.service';
import { LoggingService } from 'src/logging/logging.service';
import { LookupRepository } from 'src/lookup/lookup.repository';
import { User } from 'src/users/model/users.model';
import { GetUserByFilterQuery } from 'src/users/queries/impl';
import { AddDataCommand } from '../impl/add-data.command';
import {
  SaveAndPostPaymentCommand,
  SaveAndPostSocialsCommand,
  SaveDraftFromDiscordCommand,
} from '../impl/save-draft.command';
import { ActivityOnAddData } from './add-data.handler';

@CommandHandler(SaveDraftFromDiscordCommand)
export class SaveDraftCommandHandler
  implements ICommandHandler<SaveDraftFromDiscordCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly activityOnAddData: ActivityOnAddData,
    private readonly validationService: DataValidationService,
    private readonly responseCredentialService: ResponseCredentialService,
    private readonly lookupRepository: LookupRepository,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext('SaveDraftCommandHandler');
  }

  async execute(command: SaveDraftFromDiscordCommand) {
    const { data, channelId, callerDiscordId, skip } = command;
    try {
      const lookedUpData = await this.lookupRepository.findOne({
        key: channelId,
        keyType: 'discordThreadId',
      });
      if (!lookedUpData?.collectionId)
        throw 'Collection hasnt been indexed with the given threadId';
      const collection = await this.collectionRepository.findById(
        lookedUpData.collectionId,
      );
      if (!collection) throw new NotFoundException('Collection doesnt exist');
      if (collection.formMetadata.active === false)
        throw 'Collection is inactive';

      // Preprocess data
      const formFieldUpdates = {};
      let rewardFields = {} as {
        [key: string]: {
          chain: {
            label: string;
            value: string;
          };
          token: {
            label: string;
            value: string;
          };
          value: number;
        };
      };
      // eslint-disable-next-line prefer-const
      for (let [key, val] of Object.entries(data)) {
        if (
          key !== '***' &&
          key !== collection.formMetadata.draftNextField?.[callerDiscordId]
        ) {
          throw 'Invalid response, please respond to the last question';
        }
        let property;
        if (collection.formMetadata.draftNextField?.[callerDiscordId]) {
          property =
            collection.properties[
              collection.formMetadata.draftNextField[callerDiscordId]
            ];
          key = property.id;
        } else throw 'No next field found';

        if (property && property.isPartOfFormView) {
          if (property.type === 'number') {
            formFieldUpdates[key] = parseFloat(val);
            if (isNaN(formFieldUpdates[key])) throw 'Invalid number';
          } else if (property.type === 'reward') {
            if (val['chain']) {
              const chain = collection.formMetadata.idLookup?.[val['chain']];
              if (!chain) throw 'Invalid chain';
              val['chain'] = chain;
            }
            if (val['token']) {
              const token = collection.formMetadata.idLookup?.[val['token']];
              if (!token) throw 'Invalid token';
              val['token'] = token;
            }
            rewardFields[key] = val;
          } else if (['user'].includes(property.type)) {
            const option = collection.formMetadata.idLookup?.[val.optionId];
            if (!option) throw 'Invalid optionId';
            formFieldUpdates[key] = option;
          } else if (['user[]'].includes(property.type)) {
            const options = val.map((opt: any) => {
              const option = collection.formMetadata.idLookup?.[opt.optionId];
              if (!option) throw 'Invalid optionId';
              return option;
            });
            formFieldUpdates[key] = options;
          } else if (['singleSelect'].includes(property.type)) {
            let option;
            if (val.custom) {
              option = {
                label: val.value,
                value: '__custom__',
              };
            } else option = collection.formMetadata.idLookup?.[val.optionId];
            if (!option) throw 'Invalid optionId';
            formFieldUpdates[key] = option;
          } else if (['multiSelect'].includes(property.type)) {
            const options = val.map((option: any) => {
              if (option.custom) {
                return {
                  label: option.value,
                  value: '__custom__',
                };
              } else {
                const opt = collection.formMetadata.idLookup?.[option.optionId];
                if (!opt) throw 'Invalid optionId';
                return opt;
              }
            });
            formFieldUpdates[key] = options;
          } else if (property.type === 'slider') {
            formFieldUpdates[key] = parseInt(val.optionId || '0');
          } else formFieldUpdates[key] = val;
        }
      }
      const skippedFormFields = {};
      // eslint-disable-next-line prefer-const
      for (let [key, val] of Object.entries(skip || {})) {
        if (collection.formMetadata.idLookup?.[key])
          key = collection.formMetadata.idLookup[key];
        const property = collection.properties[key];
        if (
          (property && property.isPartOfFormView) ||
          ['paywall', 'poap', 'kudos', 'erc20', 'zealyXp'].includes(key)
        ) {
          skippedFormFields[key] = val;
        }
      }

      if (
        Object.entries(formFieldUpdates).length === 0 &&
        !data['captcha'] &&
        Object.keys(skippedFormFields).length === 0 &&
        Object.keys(rewardFields).length === 0
      )
        throw 'No valid updates';

      if (Object.entries(formFieldUpdates).length > 0) {
        const validationPassed = await this.validationService.validate(
          formFieldUpdates,
          'add',
          true,
          collection,
        );
        if (!validationPassed) throw 'Validation failed';

        const requiredFieldValidationPassed =
          await this.validationService.validateRequiredFieldForFieldsThatExist(
            collection,
            formFieldUpdates,
            'add',
          );
        if (!requiredFieldValidationPassed)
          throw 'Required field validation failed';
      }

      if (Object.keys(rewardFields).length > 0) {
        for (const [key, val] of Object.entries(rewardFields)) {
          rewardFields = {
            ...rewardFields,
            [key]: {
              ...(collection.formMetadata.drafts?.[callerDiscordId]?.[key] ||
                {}),
              ...val,
            },
          };
        }
        this.validationService.validatePartialRewardData(rewardFields);
      }

      if (data['captcha']) {
        formFieldUpdates['captcha'] = data['captcha'];
      }

      const updatedCollection = await this.collectionRepository.updateById(
        collection.id,
        {
          formMetadata: {
            ...collection.formMetadata,
            drafts: {
              ...(collection.formMetadata.drafts || {}),
              [callerDiscordId]: {
                ...(collection.formMetadata.drafts?.[callerDiscordId] || {}),
                ...formFieldUpdates,
                ...rewardFields,
              },
            },
            skippedFormFields: {
              ...(collection.formMetadata.skippedFormFields || {}),
              [callerDiscordId]: {
                ...(collection.formMetadata.skippedFormFields?.[
                  callerDiscordId
                ] || {}),
                ...skippedFormFields,
              },
            },
          },
        },
      );
      const nextField = await this.queryBus.execute(
        new GetNextFieldQuery(
          callerDiscordId,
          'discordId',
          null,
          null,
          updatedCollection,
          false,
        ),
      );
      if (
        ['poap', 'kudos', 'erc20', 'zealyXp'].includes(nextField?.type) ||
        (nextField.name === 'readonlyAtEnd' &&
          !collection.formMetadata.drafts?.[callerDiscordId]?.['saved'])
      ) {
        let user;
        try {
          user = await this.queryBus.execute(
            new GetUserByFilterQuery(
              {
                discordId: callerDiscordId,
              },
              '',
              true,
            ),
          );
        } catch (err) {
          console.log({ warning: err });
        }
        if (
          collection.formMetadata.multipleResponsesAllowed ||
          !collection.dataOwner ||
          !Object.values(collection.dataOwner)?.includes(user?.id)
        ) {
          const res = await this.commandBus.execute(
            new AddDataCommand(
              updatedCollection.formMetadata.drafts?.[callerDiscordId] ||
                collection.formMetadata.drafts?.[callerDiscordId],
              user,
              collection.id,
              collection.formMetadata.allowAnonymousResponses,
              false,
              false,
              false,
              callerDiscordId,
            ),
          );
        }
      }

      const returnedField = await this.queryBus.execute(
        new GetNextFieldQuery(
          callerDiscordId,
          'discordId',
          updatedCollection.slug,
          null,
          null,
          true,
        ),
      );
      return returnedField;
    } catch (err) {
      this.logger.logError(
        `Saving draft failed on channelId: ${channelId}, callerId: ${callerDiscordId}, data: ${data} with error ${err}`,
      );
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

@CommandHandler(SaveAndPostSocialsCommand)
export class SaveAndPostSocialsCommandHandler
  implements ICommandHandler<SaveAndPostSocialsCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly discordService: DiscordService,
    private readonly lookupRepository: LookupRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {}

  getVal(nextFieldType: string, socialsDto: SocialsDto, caller: User) {
    if (nextFieldType === 'connectWallet') {
      return {
        ethAddress: caller.ethAddress,
      };
    } else if (['github', 'telegram', 'discord'].includes(nextFieldType)) {
      if (
        nextFieldType === 'github' &&
        (!socialsDto.github?.id || !socialsDto.github?.username)
      ) {
        throw 'Github Id or username not provided';
      }
      if (
        nextFieldType === 'telegram' &&
        (!socialsDto.telegram?.id || !socialsDto.telegram?.username)
      ) {
        throw 'Telegram Id or username not provided';
      }
      if (
        nextFieldType === 'discord' &&
        (!socialsDto.discord?.id || !socialsDto.discord?.username)
      ) {
        throw 'Discord Id or username not provided';
      }
      return socialsDto[nextFieldType];
    }
  }

  async execute(command: SaveAndPostSocialsCommand) {
    const { socialsDto, channelId, caller } = command;
    try {
      const lookedUpData = await this.lookupRepository.findOne({
        key: channelId,
        keyType: 'discordThreadId',
      });
      if (!lookedUpData?.collectionId)
        throw 'Collection hasnt been indexed with the given threadId';
      const collection = await this.collectionRepository.findById(
        lookedUpData.collectionId,
      );
      if (!collection) throw new NotFoundException('Collection not found');

      let nextField;
      const decodedPropertName = decodeURIComponent(socialsDto.propertyName);
      console.log({ decodedPropertName });
      if (decodedPropertName === 'connectWallet') {
        nextField = {
          type: 'connectWallet',
          name: 'connectWallet',
        };
      } else {
        nextField = collection.properties[decodedPropertName];
        if (!nextField) throw new NotFoundException('Property not found');
        if (!['github', 'telegram'].includes(nextField.type))
          throw new NotFoundException(
            'Property must be of type github, telegram, connectWallet',
          );
      }
      let discordId;
      if ((nextField as any).type === 'connectWallet') {
        discordId = caller.discordId;
      } else {
        discordId = socialsDto.discordId;
      }

      if (!discordId) throw 'Discord Id not found';

      const nextFieldVal = this.getVal(nextField.type, socialsDto, caller);
      let updatedCollection;
      if (['github', 'discord', 'telegram'].includes(nextField.type)) {
        const updatedDraft = {
          ...(collection.formMetadata.drafts || {}),
          [discordId]: {
            ...(collection.formMetadata.drafts?.[discordId] || {}),
            [nextField.id]: nextFieldVal,
          },
        };
        updatedCollection = await this.collectionRepository.updateById(
          collection.id,
          {
            formMetadata: {
              ...collection.formMetadata,
              drafts: updatedDraft,
            },
          },
        );
      }

      const nextToNextField = await this.queryBus.execute(
        new GetNextFieldQuery(
          discordId,
          'discordId',
          collection.slug,
          null,
          null,
          true,
        ),
      );
      await this.discordService.postSocials(
        channelId,
        {
          ...nextField,
          value: nextFieldVal,
        } as Property,
        nextToNextField,
        discordId,
      );

      // Save draft to data if next field is readonlyAtEnd or poap/kudos/erc20
      if (
        ['poap', 'kudos', 'erc20', 'zealyXp'].includes(nextToNextField?.type) ||
        (nextToNextField.name === 'readonlyAtEnd' &&
          !collection.formMetadata.drafts?.[discordId]?.['saved'])
      ) {
        let user;
        try {
          user = await this.queryBus.execute(
            new GetUserByFilterQuery(
              {
                discordId: discordId,
              },
              '',
              true,
            ),
          );
        } catch (err) {
          console.log({ warning: err });
        }

        if (
          collection.formMetadata.multipleResponsesAllowed ||
          !collection.dataOwner ||
          !Object.values(collection.dataOwner)?.includes(user?.id)
        ) {
          const res = await this.commandBus.execute(
            new AddDataCommand(
              updatedCollection.formMetadata.drafts?.[discordId] ||
                collection.formMetadata.drafts?.[discordId],
              user,
              collection.id,
              collection.formMetadata.allowAnonymousResponses,
              false,
              false,
              false,
              discordId,
            ),
          );
        }
      }

      return { success: true };
    } catch (err) {
      console.log({ err });
      this.logger.error(
        `Failed while saving and posting socials on Discord with ${err}`,
      );
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

@CommandHandler(SaveAndPostPaymentCommand)
export class SaveAndPostPaymentCommandHandler
  implements ICommandHandler<SaveAndPostPaymentCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly discordService: DiscordService,
    private readonly lookupRepository: LookupRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(SaveAndPostPaymentCommandHandler.name);
  }

  async execute(command: SaveAndPostPaymentCommand) {
    const { formPaymentDto, channelId, caller, discordUserId } = command;
    try {
      if (!discordUserId) throw 'No discord Id provided, cannot get next field';
      const lookedUpData = await this.lookupRepository.findOne({
        key: channelId,
        keyType: 'discordThreadId',
      });
      if (!lookedUpData?.collectionId)
        throw 'Collection hasnt been indexed with the given threadId';
      const collection = await this.collectionRepository.findById(
        lookedUpData.collectionId,
      );
      if (!collection) throw new NotFoundException('Collection not found');
      const nextField = await this.queryBus.execute(
        new GetNextFieldQuery(
          discordUserId,
          'discordId',
          null,
          null,
          collection,
          true,
        ),
      );

      let updatedCollection;
      if (['paywall'].includes(nextField.type)) {
        const updatedDraft = {
          ...(collection.formMetadata.drafts || {}),
          [discordUserId]: {
            ...(collection.formMetadata.drafts?.[discordUserId] || {}),
            __payment__: {
              ...formPaymentDto,
              paid: true,
            },
          },
        };
        updatedCollection = await this.collectionRepository.updateById(
          collection.id,
          {
            formMetadata: {
              ...collection.formMetadata,
              drafts: updatedDraft,
            },
          },
        );
      }

      const nextToNextField = await this.queryBus.execute(
        new GetNextFieldQuery(
          discordUserId,
          'discordId',
          collection.slug,
          null,
          null,
          true,
        ),
      );
      await this.discordService.postFormPayment(
        channelId,
        {
          ...nextField,
          value: formPaymentDto,
        },
        nextToNextField,
        discordUserId,
      );

      if (
        ['poap', 'kudos', 'erc20', 'zealyXp'].includes(nextToNextField?.type) ||
        (nextToNextField.name === 'readonlyAtEnd' &&
          !collection.formMetadata.drafts?.[discordUserId]?.['saved'])
      ) {
        let user;
        try {
          user = await this.queryBus.execute(
            new GetUserByFilterQuery(
              {
                discordId: discordUserId,
              },
              '',
              true,
            ),
          );
        } catch (err) {
          console.log({ warning: err });
        }
        if (
          collection.formMetadata.multipleResponsesAllowed ||
          !collection.dataOwner ||
          !Object.values(collection.dataOwner)?.includes(user?.id)
        ) {
          const res = await this.commandBus.execute(
            new AddDataCommand(
              updatedCollection.formMetadata.drafts?.[discordUserId],
              user,
              collection.id,
              collection.formMetadata.allowAnonymousResponses,
              false,
              false,
              false,
              discordUserId,
            ),
          );
        }
      }

      return { success: true };
    } catch (err) {
      console.log({ err });
      this.logger.error(
        `Failed while saving and posting payment on Discord with ${err}`,
      );
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

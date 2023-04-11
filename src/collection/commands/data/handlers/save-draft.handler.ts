import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { GetNextFieldQuery } from 'src/collection/queries';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { LoggingService } from 'src/logging/logging.service';
import { AddDataUsingAutomationCommand } from '../impl/add-data.command';
import {
  SaveAndPostPaymentCommand,
  SaveAndPostSocialsCommand,
  SaveDraftFromDiscordCommand,
} from '../impl/save-draft.command';
import { ActivityOnAddData } from './add-data.handler';
import { v4 as uuid } from 'uuid';
import { DataAddedEvent } from 'src/collection/events';
import { LookupRepository } from 'src/lookup/lookup.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UpdateUserCommand } from 'src/users/commands/impl';
import { DiscordService } from 'src/common/discord.service';
import { SocialsDto } from 'src/collection/dto/socials.dto';
import { User } from 'src/users/model/users.model';
import { GetUserByFilterQuery } from 'src/users/queries/impl';
import { isUUID } from 'class-validator';

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
    private readonly advancedAccessService: AdvancedAccessService,
    private readonly lookupRepository: LookupRepository,
  ) {
    this.logger.setContext('AddDataCommandHandler');
  }

  async execute(command: SaveDraftFromDiscordCommand) {
    const { data, channelId, callerDiscordId, skip } = command;
    try {
      console.log({ data, channelId, callerDiscordId });
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
        if (isUUID(key) && collection.formMetadata.idLookup?.[key])
          key = collection.formMetadata.idLookup[key];
        console.log({ key });
        const property = collection.properties[key];
        if (property && property.isPartOfFormView) {
          if (property.type === 'number') {
            formFieldUpdates[key] = parseFloat(val);
          } else if (property.type === 'reward') {
            if (val['chain']) {
              const chain = collection.formMetadata.idLookup?.[val['chain']];
              console.log({ chain });
              if (!chain) throw 'Invalid chain';
              val['chain'] = chain;
            }
            if (val['token']) {
              const token = collection.formMetadata.idLookup?.[val['token']];
              if (!token) throw 'Invalid token';
              val['token'] = token;
            }
            rewardFields[key] = val;
          } else if (['singleSelect', 'user'].includes(property.type)) {
            const option = collection.formMetadata.idLookup?.[val];
            if (!option) throw 'Invalid optionId';
            formFieldUpdates[key] = option;
          } else if (['multiSelect', 'user'].includes(property.type)) {
            const options = val.map((optionId: string) => {
              const option = collection.formMetadata.idLookup?.[optionId];
              if (!option) throw 'Invalid optionId';
              return option;
            });
            formFieldUpdates[key] = options;
          } else formFieldUpdates[key] = val;
        }
      }

      const skippedFormFields = {};
      // eslint-disable-next-line prefer-const
      for (let [key, val] of Object.entries(skip || {})) {
        if (collection.formMetadata.idLookup?.[key])
          key = collection.formMetadata.idLookup[key];
        const property = collection.properties[key];
        if (property && property.isPartOfFormView) {
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

      console.log({ formFieldUpdates });
      const res = await this.collectionRepository.updateById(collection.id, {
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
      });
      const nextField = await this.queryBus.execute(
        new GetNextFieldQuery(
          callerDiscordId,
          'discordId',
          null,
          null,
          res,
          true,
        ),
      );
      console.log({ nextField });
      if (nextField.name === 'readonlyAtEnd') {
        /** Disabling activity for forms as it doesnt quite make sense yet */

        const slug = uuid();
        const data = {
          ...collection.data,
          [slug]: {
            ...res.formMetadata.drafts[callerDiscordId],
            slug,
          },
        };
        const { dataActivities, dataActivityOrder } =
          this.activityOnAddData.getActivity(collection, data[slug], null);
        console.log({ dataActivities, dataActivityOrder });
        const updatedCollection = await this.collectionRepository.updateById(
          collection.id,
          {
            data,
            dataActivities,
            dataActivityOrder,
            dataOwner: {
              ...(collection.dataOwner || {}),
              [slug]: callerDiscordId,
            },
          },
        );
        console.log('succ');
        this.eventBus.publish(new DataAddedEvent(collection, data, null));
      }
      return nextField;
    } catch (err) {
      this.logger.logError(`Saving draft failed with error ${err}`);
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
      if (!socialsDto.discordId)
        throw 'No discord Id provided, cannot get next field';
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
          socialsDto.discordId || caller.discordId,
          'discordId',
          null,
          null,
          collection,
          true,
        ),
      );
      console.log({ nextField, socialsDto });

      const nextFieldVal = this.getVal(nextField.type, socialsDto, caller);
      console.log({ nextFieldVal });
      if (['github', 'discord', 'telegram'].includes(nextField.type)) {
        const updatedDraft = {
          ...(collection.formMetadata.drafts || {}),
          [socialsDto.discordId]: {
            ...(collection.formMetadata.drafts?.[socialsDto.discordId] || {}),
            [nextField.name]: nextFieldVal,
          },
        };
        console.log({ updatedDraft, colId: collection.id });
        const res = await this.collectionRepository.updateById(collection.id, {
          formMetadata: {
            ...collection.formMetadata,
            drafts: updatedDraft,
          },
        });

        console.log({ draft: res.formMetadata.drafts[socialsDto.discordId] });
      }

      // Add to user data (should never cause failure in form data update)
      try {
        let callingUser = caller;
        if (!callingUser) {
          callingUser = await this.queryBus.execute(
            new GetUserByFilterQuery(
              {
                discordId: socialsDto.discordId,
              },
              '',
              true,
            ),
          );
        }
        const userUpdates = {};
        for (const [key, val] of Object.entries(socialsDto)) {
          if (callingUser[key] !== val) {
            userUpdates[key] = val;
          }
        }
        if (Object.keys(userUpdates).length > 0) {
          await this.commandBus.execute(
            new UpdateUserCommand(userUpdates, callingUser),
          );
        }
      } catch (err) {
        console.log({ err });
      }

      const nextToNextField = await this.queryBus.execute(
        new GetNextFieldQuery(
          socialsDto.discordId,
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
        },
        nextToNextField,
        socialsDto.discordId,
      );

      return { success: true };
    } catch (err) {
      console.log({ err });
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
  ) {}

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
        console.log({ updatedDraft, colId: collection.id });
        const res = await this.collectionRepository.updateById(collection.id, {
          formMetadata: {
            ...collection.formMetadata,
            drafts: updatedDraft,
          },
        });
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

      return { success: true };
    } catch (err) {
      console.log({ err });
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

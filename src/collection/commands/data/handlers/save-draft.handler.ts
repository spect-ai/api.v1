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
    const { data, channelId, callerDiscordId } = command;
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
      const updates = {};
      for (const [key, val] of Object.entries(data)) {
        const property = collection.properties[key];
        console.log({ property });
        if (property) {
          if (property.type === 'number') {
            updates[key] = parseFloat(val);
          } else updates[key] = val;
        }
      }
      console.log({ updates });

      if (Object.entries(updates).length === 0) throw 'No valid updates';

      const validationPassed = await this.validationService.validate(
        updates,
        'add',
        true,
        collection,
      );
      if (!validationPassed) throw 'Validation failed';

      const requiredFieldValidationPassed =
        await this.validationService.validateRequiredFieldForFieldsThatExist(
          collection,
          updates,
          'add',
        );
      if (!requiredFieldValidationPassed)
        throw 'Required field validation failed';

      const res = await this.collectionRepository.updateById(collection.id, {
        formMetadata: {
          ...collection.formMetadata,
          drafts: {
            ...(collection.formMetadata.drafts || {}),
            [callerDiscordId]: {
              ...(collection.formMetadata.drafts?.[callerDiscordId] || {}),
              ...updates,
            },
          },
        },
      });
      const nextField = await this.queryBus.execute(
        new GetNextFieldQuery(callerDiscordId, 'discordId', null, null, res),
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
            data: {
              ...collection.data,
              [slug]: res.formMetadata.drafts[callerDiscordId],
            },
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
    } else if (nextFieldType === 'github') {
      return {
        githubId: socialsDto.githubId,
        githubUsername: socialsDto.githubUsername,
      };
    } else if (nextFieldType === 'discord') {
      return {
        discordId: socialsDto.discordId,
        discordUsername: socialsDto.discordUsername,
      };
    } else if (nextFieldType === 'telegram') {
      return {
        telegramId: socialsDto.telegramId,
        telegramUsername: socialsDto.telegramUsername,
      };
    }
  }

  async execute(command: SaveAndPostSocialsCommand) {
    const { socialsDto, channelId, caller } = command;
    try {
      if (!caller.discordId && !socialsDto.discordId)
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
        ),
      );

      const nextFieldVal = this.getVal(nextField.type, socialsDto, caller);

      if (['github', 'discord', 'telegram'].includes(nextField.name)) {
        const res = await this.collectionRepository.updateById(collection.id, {
          formMetadata: {
            ...collection.formMetadata,
            drafts: {
              ...(collection.formMetadata.drafts || {}),
              [socialsDto.discordId || caller.discordId]: {
                ...(collection.formMetadata.drafts?.[
                  socialsDto.discordId || caller.discordId
                ] || {}),
                [nextField.name]: nextFieldVal,
              },
            },
          },
        });
      }

      const userUpdates = {};
      for (const [key, val] of Object.entries(socialsDto)) {
        if (caller[key] !== val) {
          userUpdates[key] = val;
        }
      }
      if (Object.keys(userUpdates).length > 0) {
        const res = await this.commandBus.execute(
          new UpdateUserCommand(userUpdates, caller),
        );
      }
      const nextToNextField = await this.queryBus.execute(
        new GetNextFieldQuery(
          socialsDto.discordId || caller.discordId,
          'discordId',
          null,
          null,
          collection,
        ),
      );

      console.log({ nextField, nextFieldVal });
      await this.discordService.postSocials(
        channelId,
        {
          ...nextField,
          value: nextFieldVal,
        },
        nextToNextField,
        socialsDto.discordId || caller.discordId,
      );

      return true;
    } catch (err) {
      console.log({ err });
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

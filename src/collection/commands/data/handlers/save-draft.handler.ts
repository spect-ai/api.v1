import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { GetNextFieldQuery } from 'src/collection/queries';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { LoggingService } from 'src/logging/logging.service';
import { SaveDraftFromDiscordCommand } from '../impl/save-draft.command';

@CommandHandler(SaveDraftFromDiscordCommand)
export class SaveDraftCommandHandler
  implements ICommandHandler<SaveDraftFromDiscordCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly advancedAccessService: AdvancedAccessService,
  ) {
    this.logger.setContext('AddDataCommandHandler');
  }

  async execute(command: SaveDraftFromDiscordCommand) {
    const { data, channelId, callerDiscordId } = command;
    try {
      const collection = await this.collectionRepository.findOne({
        'collectionLevelDiscordThreadRef.threadId': channelId,
      });
      if (!collection) throw new NotFoundException('Collection doesnt exist');
      if (collection.formMetadata.active === false)
        throw 'Collection is inactive';

      const updates = {};
      for (const [key, val] of Object.entries(data)) {
        if (collection.properties[key]) {
          updates[key] = val;
        }
      }
      console.log({ updates });

      if (Object.entries(updates).length === 0) return false;
      console.log({ updates });

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
      return await this.queryBus.execute(
        new GetNextFieldQuery(callerDiscordId, 'discordId', null, null, res),
      );
    } catch (err) {
      this.logger.logError(`Saving draft failed with error ${err}`);
      throw new InternalServerErrorException(err);
    }
  }
}

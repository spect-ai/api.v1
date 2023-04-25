import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { SaveAndPostSocialsCommand } from '../impl/save-draft.command';
import { DeleteDraftCommand } from '../impl/delete-draft.command';
import { LoggingService } from 'src/logging/logging.service';
import { NotFoundException } from '@nestjs/common';
import { GetCollectionByFilterQuery } from 'src/collection/queries';
import { CollectionRepository } from 'src/collection/collection.repository';

@CommandHandler(DeleteDraftCommand)
export class DeleteDraftCommandHandler
  implements ICommandHandler<DeleteDraftCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {}

  async execute(command: DeleteDraftCommand) {
    try {
      const { discordId, messageId } = command;
      const collection = await this.queryBus.execute(
        new GetCollectionByFilterQuery({
          'collectionLevelDiscordThreadRef.messageId': messageId,
        }),
      );
      if (!collection) throw new NotFoundException('Collection not found');
      const formMetadata = collection.formMetadata;

      if (collection.formMetadata.drafts?.[discordId])
        delete formMetadata.drafts[discordId];

      if (collection.formMetadata.skippedFormFields?.[discordId])
        delete formMetadata.skippedFormFields[discordId];
      await this.collectionRepository.updateById(collection.id, {
        formMetadata,
      });

      return {
        success: true,
      };
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}

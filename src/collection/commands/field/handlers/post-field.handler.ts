import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { GetCollectionService } from 'src/collection/services/get-collection.service';
import { LoggingService } from 'src/logging/logging.service';
import { PostNextFieldCommand } from '../impl/post-field.command';

@CommandHandler(PostNextFieldCommand)
export class PostNextFieldCommandHandler
  implements ICommandHandler<PostNextFieldCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly getCollectionService: GetCollectionService,
  ) {
    this.logger.setContext(PostNextFieldCommandHandler.name);
  }

  async execute(command: PostNextFieldCommand) {
    console.log('PostNextFieldCommandHandler');

    const { discordUserId, channelId } = command;
    try {
      const collection = await this.getCollectionService.getCollectionFromAnyId(
        undefined,
        undefined,
        channelId,
      );
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}

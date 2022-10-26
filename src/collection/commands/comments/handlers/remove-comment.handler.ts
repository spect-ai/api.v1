import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { AddCommentCommand } from '../impl/add-comment.command';
import { RemoveCommentCommand } from '../impl/remove-comment.command';

@CommandHandler(RemoveCommentCommand)
export class RemoveCommentCommandHandler
  implements ICommandHandler<RemoveCommentCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RemoveCommentCommandHandler');
  }

  async execute(command: RemoveCommentCommand) {
    const { caller, collectionId, dataSlug, activityId } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      if (caller?.id !== collection.dataActivities[dataSlug][activityId].owner)
        throw `Unauthorized to update comment`;
      delete collection.dataActivities[dataSlug][activityId];
      const idx = collection.dataActivityOrder[dataSlug].findIndex(
        (a) => a === activityId,
      );
      collection.dataActivityOrder[dataSlug].splice(idx, 1);
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          dataActivities: collection.dataActivities,
          dataActivityOrder: collection.dataActivityOrder,
        },
      );
      return updatedCollection;
    } catch (err) {
      this.logger.error(
        `Failed adding comment to collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed adding comment to collection Id ${collectionId} with error ${err}`,
      );
    }
  }
}

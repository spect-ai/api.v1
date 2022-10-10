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

@CommandHandler(AddCommentCommand)
export class AddCommentCommandHandler
  implements ICommandHandler<AddCommentCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddCommentCommandHandler');
  }

  async execute(command: AddCommentCommand) {
    const { caller, collectionId, dataSlug, content, ref } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      const activityId = uuidv4();
      const dataActivities = {
        ...collection.dataActivities,
        [dataSlug]: {
          ...(collection.dataActivities[dataSlug] || {}),
          [activityId]: {
            content,
            ref,
            timestamp: new Date(),
            imageRef: 'commentAdded',
            owner: caller?.id,
            comment: true,
          },
        },
      };
      const dataActivityOrder = {
        ...collection.dataActivityOrder,
        [dataSlug]: [
          ...(collection.dataActivityOrder[dataSlug] || []),
          activityId,
        ],
      };
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          dataActivities,
          dataActivityOrder,
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

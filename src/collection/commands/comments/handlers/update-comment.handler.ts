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
import { UpdateCommentCommand } from '../impl/update-comment.command';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentCommandHandler
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateCommentCommandHandler');
  }

  async execute(command: UpdateCommentCommand) {
    const { caller, collectionId, dataSlug, content, ref, activityId } =
      command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      if (caller?.id !== collection.dataActivities[dataSlug][activityId].owner)
        throw `Unauthorized to update comment`;
      const dataActivities = {
        ...collection.dataActivities,
        [dataSlug]: {
          ...(collection.dataActivities[dataSlug] || {}),
          [activityId]: {
            content,
            ref,
            timestamp: new Date(),
            imageRef: 'commentUpdated',
            owner: caller?.id,
            comment: true,
          },
        },
      };

      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          dataActivities,
        },
      );
      return updatedCollection;
    } catch (err) {
      this.logger.error(
        `Failed updating comment to collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed updating comment to collection Id ${collectionId} with error ${err}`,
      );
    }
  }
}

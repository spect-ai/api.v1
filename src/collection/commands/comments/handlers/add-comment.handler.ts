import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { CommentAddedEvent, DataUpatedEvent } from 'src/collection/events';
import {
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { AddCommentCommand } from '../impl/add-comment.command';

@CommandHandler(AddCommentCommand)
export class AddCommentCommandHandler
  implements ICommandHandler<AddCommentCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly eventBus: EventBus,
  ) {
    this.logger.setContext('AddCommentCommandHandler');
  }

  async execute(command: AddCommentCommand) {
    const { caller, collectionId, dataSlug, content, ref, isPublic } = command;
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
      this.eventBus.publish(
        new DataUpatedEvent(
          collection,
          collection.data[dataSlug],
          collection.data[dataSlug],
          caller,
        ),
      );

      this.eventBus.publish(
        new CommentAddedEvent(collection, collection.data[dataSlug], caller),
      );

      if (isPublic)
        return await this.queryBus.execute(
          new GetPublicViewCollectionQuery(caller, updatedCollection.slug),
        );
      else
        return await this.queryBus.execute(
          new GetPrivateViewCollectionQuery(null, updatedCollection),
        );
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

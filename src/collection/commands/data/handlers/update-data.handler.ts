import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateDataCommand } from '../impl/update-data.command';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { DataUpatedEvent } from 'src/collection/events';
import { ActivityBuilder } from 'src/collection/services/activity.service';
import {
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from 'src/collection/queries';

@CommandHandler(UpdateDataCommand)
export class UpdateDataCommandHandler
  implements ICommandHandler<UpdateDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly activityBuilder: ActivityBuilder,
  ) {
    this.logger.setContext('UpdateDataCommandHandler');
  }

  async execute(command: UpdateDataCommand) {
    const { data, caller, collectionId, dataSlug, view } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      // Required to maitain backward compatibility
      if (collection.active === false) throw 'Collection is inactive';

      if (!collection.updatingResponseAllowed) {
        throw 'Updating response is not allowed';
      }
      if (!collection.dataOwner[dataSlug]) {
        throw 'You are not the owner of this data';
      }
      const validData = await this.validationService.validate(
        data,
        'update',
        false,
        collection,
      );
      if (!validData) {
        throw new Error(`Data invalid`);
      }
      const { dataActivities, dataActivityOrder } = this.activityBuilder.build(
        data,
        collection,
        dataSlug,
        caller?.id,
      );
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: {
            ...collection.data,
            [dataSlug]: {
              ...collection.data[dataSlug],
              ...data,
            },
          },
          dataActivities,
          dataActivityOrder,
        },
      );
      this.eventBus.publish(
        new DataUpatedEvent(collection, data, dataSlug, caller),
      );
      if (view === 'public') {
        const publicView = await this.queryBus.execute(
          new GetPublicViewCollectionQuery(
            caller,
            collection.slug,
            updatedCollection,
          ),
        );
        return publicView;
      }
      return await await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug, updatedCollection),
      );
    } catch (err) {
      this.logger.error(
        `Failed updating data in collection with collection Id ${collectionId} with error ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Failed updating data in collection to collection Id ${collectionId} with error ${err.message}`,
      );
    }
  }
}

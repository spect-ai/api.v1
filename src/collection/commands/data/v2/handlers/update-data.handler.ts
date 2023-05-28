import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { DataUpatedEvent } from 'src/collection/events';
import { Collection } from 'src/collection/model/collection.model';
import {
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from 'src/collection/queries';
import { ActivityBuilder } from 'src/collection/services/activity.service';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateProjectDataCommand } from '../impl/update-data.command';

@CommandHandler(UpdateProjectDataCommand)
export class UpdateProjectDataCommandHandler
  implements ICommandHandler<UpdateProjectDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly activityBuilder: ActivityBuilder,
  ) {
    this.logger.setContext('UpdateProjectDataCommandHandler');
  }

  async execute(command: UpdateProjectDataCommand) {
    const { data, caller, collectionId, dataSlug } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      if (collection.collectionType !== 1) throw 'Collection is not a project';

      // remove all properties from the upadte which are same as the existing data
      for (const [key, value] of Object.entries(data)) {
        if (
          JSON.stringify(collection.data[dataSlug][key]) ===
          JSON.stringify(value)
        ) {
          delete data[key];
        }
      }

      if (Object.keys(data).length === 0) {
        return;
      }

      const filteredData = this.filterUndefinedValues(data);
      await this.validationService.validate(
        filteredData,
        'update',
        false,
        collection,
      );

      const { dataActivities, dataActivityOrder } = this.activityBuilder.build(
        filteredData,
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
              ...filteredData,
            },
          },
          dataActivities,
          dataActivityOrder,
        },
      );
      const propertyName = Object.keys(data)[0];
      if (collection.projectMetadata.cardOrders?.[propertyName]) {
        await this.addDataToViews(collection, data, dataSlug, propertyName);
      }

      this.eventBus.publish(
        new DataUpatedEvent(collection, filteredData, dataSlug, caller),
      );
      return {
        data: updatedCollection.data[dataSlug],
      };
    } catch (err) {
      this.logger.error(
        `Failed updating data in project with id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(`${err}`);
    }
  }

  filterUndefinedValues(data: object) {
    const filteredData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        filteredData[key] = value;
      }
    }
    return filteredData;
  }

  async addDataToViews(
    collection: Collection,
    update: object,
    slug: string,
    propertyName: string,
  ) {
    const columns = collection.properties[propertyName].options;
    const cardColumnOrder = collection.projectMetadata.cardOrders[propertyName];
    const sourceColumnIndex =
      columns.findIndex(
        (column) => column.value === collection.data[slug][propertyName]?.value,
      ) + 1;
    const destColumnIndex =
      columns.findIndex(
        (column) => column.value === update[propertyName]?.value,
      ) + 1;
    const newSourceColumnOrder = Array.from(
      cardColumnOrder[sourceColumnIndex] || [],
    );
    newSourceColumnOrder.splice(newSourceColumnOrder.indexOf(slug), 1);
    const newDestColumnOrder = Array.from(
      cardColumnOrder[destColumnIndex] || [],
    );
    newDestColumnOrder.splice(0, 0, slug);
    const newCardColumnOrder = Array.from(cardColumnOrder);
    newCardColumnOrder[sourceColumnIndex] = newSourceColumnOrder;
    newCardColumnOrder[destColumnIndex] = newDestColumnOrder;
    return await this.collectionRepository.updateById(collection.id, {
      projectMetadata: {
        ...collection.projectMetadata,
        cardOrders: {
          ...collection.projectMetadata.cardOrders,
          [propertyName]: newCardColumnOrder,
        },
      },
    });
  }
}

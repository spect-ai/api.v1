import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import {
  UpdateDataCommand,
  UpdateDataUsingAutomationCommand,
} from '../impl/update-data.command';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { DataUpatedEvent } from 'src/collection/events';
import { ActivityBuilder } from 'src/collection/services/activity.service';
import {
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from 'src/collection/queries';
import { Collection } from 'src/collection/model/collection.model';
import { HasSatisfiedDataConditionsQuery } from 'src/automation/queries/impl';
import { GetProfileQuery } from 'src/users/queries/impl';
import { v4 as uuidv4 } from 'uuid';

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

      if (!collection) throw 'Collection does not exist';
      if (collection.collectionType === 0) {
        if (collection.formMetadata.active === false)
          throw 'Collection is inactive';

        if (
          !collection.formMetadata.updatingResponseAllowed &&
          view === 'public'
        ) {
          throw 'Updating response is not allowed';
        }
        // if (!collection.dataOwner[dataSlug]) {
        //   throw 'You are not the owner of this data';
        // }
      }
      let filteredData = data;
      if (view === 'public') {
        filteredData =
          await this.filterValuesWherePropertyDoesntSatisfyCondition(
            collection,
            data,
          );
      }
      filteredData = this.filterUndefinedValues(filteredData);
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
      if (data['anonymous'] !== undefined) {
        filteredData['anonymous'] = data['anonymous'];
      }

      let updatedCollection;
      updatedCollection = await this.collectionRepository.updateById(
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
      if (
        collection.collectionType === 1 &&
        collection.projectMetadata.cardOrders &&
        collection.projectMetadata.cardOrders[propertyName]
      ) {
        updatedCollection = await this.addDataToViews(
          collection,
          data,
          dataSlug,
          propertyName,
        );
      }

      this.eventBus.publish(
        new DataUpatedEvent(collection, filteredData, dataSlug, caller),
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
        new GetPrivateViewCollectionQuery(collection.slug),
      );
    } catch (err) {
      this.logger.error(
        `Failed updating data in collection with collection Id ${collectionId} with error ${err}`,
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

  async filterValuesWherePropertyDoesntSatisfyCondition(
    collection: Collection,
    data: object,
  ) {
    const filteredData = {};
    for (const [propertyId, property] of Object.entries(
      collection.properties,
    )) {
      console.log({ property });
      if (property.viewConditions) {
        const condition = property.viewConditions;
        const satisfied = await this.queryBus.execute(
          new HasSatisfiedDataConditionsQuery(collection, data, condition),
        );
        console.log({ propertyId, satisfied });
        if (satisfied) filteredData[propertyId] = data[propertyId];
      } else {
        filteredData[propertyId] = data[propertyId];
      }
    }
    filteredData['__cardStatus__'] = data['__cardStatus__'];
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
@CommandHandler(UpdateDataUsingAutomationCommand)
export class UpdateDataUsingAutomationCommandHandler
  implements ICommandHandler<UpdateDataUsingAutomationCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly activityBuilder: ActivityBuilder,
  ) {
    this.logger.setContext('AddDataUsingAutomationCommandHandler');
  }

  async execute(command: UpdateDataUsingAutomationCommand) {
    const { data, collectionId, dataSlug } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';

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

      const botUser = await this.queryBus.execute(
        new GetProfileQuery(
          {
            username: 'Stu, the Spect Bot',
          },
          '',
        ),
      );
      const validData = await this.validationService.validate(
        data,
        'add',
        true,
        collection,
      );
      if (!validData) {
        throw new Error(`Data invalid`);
      }
      for (const [propertyId, property] of Object.entries(
        collection.properties,
      )) {
        if (property.default && !data[propertyId]) {
          data[propertyId] = property.default;
        }
      }
      const { dataActivities, dataActivityOrder } = this.activityBuilder.build(
        data,
        collection,
        dataSlug,
        botUser.id,
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
      console.log(updatedCollection?.data?.[dataSlug]);
      return true;
    } catch (err) {
      this.logger.error(
        `Failed updating data via automation to collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed updating data via automation data to collection Id ${collectionId} with error ${err}`,
      );
    }
  }
}

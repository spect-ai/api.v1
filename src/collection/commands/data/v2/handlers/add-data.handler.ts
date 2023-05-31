import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { DataAddedEvent } from 'src/collection/events';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { AddProjectDataCommand } from '../impl/add-data.command';
import { ActivityOnAddData } from '../../handlers/add-data.handler';

@CommandHandler(AddProjectDataCommand)
export class AddProjectDataCommandHandler
  implements ICommandHandler<AddProjectDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly activityOnAddData: ActivityOnAddData,
  ) {
    this.logger.setContext('AddProjectDataCommandHandler');
  }

  async execute(command: AddProjectDataCommand) {
    const { data, caller, collectionSlug, validateData } = command;
    try {
      const collection = await this.collectionRepository.findOne({
        slug: collectionSlug,
      });
      if (!collection) throw 'Collection does not exist';
      if (collection.collectionType !== 1) throw 'Collection is not a project';

      const filteredData = await this.filterUndefinedValues(data);

      if (validateData) {
        const validData = await this.validationService.validate(
          filteredData,
          'add',
          false,
          collection,
        );
        if (!validData) {
          throw new Error(`Data invalid`);
        }
      }
      for (const [propertyId, property] of Object.entries(
        collection.properties,
      )) {
        if (property.default && !filteredData[propertyId]) {
          filteredData[propertyId] = property.default;
        }
      }

      filteredData['slug'] = uuidv4();

      const { dataActivities, dataActivityOrder } =
        this.activityOnAddData.getActivity(
          collection,
          filteredData,
          caller?.id,
        );
      const cardOrders = collection.projectMetadata?.cardOrders || {};
      if (Object.keys(cardOrders).length) {
        Object.keys(cardOrders).forEach((groupByColumn) => {
          const columnIndex = collection.properties[
            groupByColumn
          ].options.findIndex(
            (option) => option.value === data[groupByColumn]?.value,
          );
          try {
            cardOrders[groupByColumn][columnIndex + 1].push(
              filteredData['slug'],
            );
          } catch (e) {
            // initialising the empty columns if they dont exist till that last index
            for (
              let i = cardOrders[groupByColumn].length;
              i <= columnIndex + 1;
              i++
            ) {
              cardOrders[groupByColumn].push([]);
            }
            cardOrders[groupByColumn][columnIndex + 1].push(
              filteredData['slug'],
            );
          }
        });
      }

      const updatedCollection = await this.collectionRepository.updateById(
        collection.id,
        {
          data: {
            ...collection.data,
            [filteredData['slug']]: filteredData,
          },
          dataActivities,
          dataActivityOrder,
          dataOwner: {
            ...(collection.dataOwner || {}),
            [filteredData['slug']]: caller?.id,
          },
          projectMetadata: {
            ...collection.projectMetadata,
            cardOrders,
          },
        },
      );

      this.eventBus.publish(
        new DataAddedEvent(collection, filteredData, caller),
      );

      return {
        data: updatedCollection.data[filteredData['slug']],
      };
    } catch (err) {
      console.log({ err });
      this.logger.error(
        `Failed adding data to collection Id ${collectionSlug} with error ${err}`,
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
}

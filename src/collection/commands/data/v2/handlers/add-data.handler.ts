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
import { ProjectDataValidationV2Service } from 'src/collection/services/v2/data-validation-v2.service';
import { Collection } from 'src/collection/model/collection.model';
import { Property } from 'src/collection/types/types';

@CommandHandler(AddProjectDataCommand)
export class AddProjectDataCommandHandler
  implements ICommandHandler<AddProjectDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: ProjectDataValidationV2Service,
    private readonly activityOnAddData: ActivityOnAddData,
  ) {
    this.logger.setContext('AddProjectDataCommandHandler');
  }

  async execute(command: AddProjectDataCommand) {
    const { data, caller, collectionSlug, validateData, atomic } = command;
    try {
      const collection = await this.collectionRepository.findOne({
        slug: collectionSlug,
      });
      if (!collection) throw 'Collection does not exist';
      if (collection.collectionType !== 1) throw 'Collection is not a project';

      let filteredData = this.filterUndefinedValues(data);
      let collectionProeperties = collection.properties;
      if (validateData) {
        const validationResult = await this.validationService.validate(
          filteredData,
          collection,
          null,
          !atomic,
        );
        if (!atomic) {
          const invalidProepertyIds = [
            ...validationResult['invalidProperties'],
            ...validationResult['invalidTypes'],
          ];
          if (invalidProepertyIds.length) {
            const { data, properties, remainingInvalidFields } =
              this.fixTheFixables(
                filteredData,
                collection,
                invalidProepertyIds,
              );
            console.log({ data });
            const fixedData = this.removeTheUnfixables(
              data,
              remainingInvalidFields,
            );
            console.log({ fixedData });
            filteredData = fixedData;
            collectionProeperties = properties;
          }
        } else if (validationResult !== true) {
          throw 'Invalid data';
        }
      }
      console.log({ filteredData });
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
          const columnIndex = collectionProeperties[
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
          properties: collectionProeperties,
        },
      );

      this.eventBus.publish(
        new DataAddedEvent(updatedCollection, filteredData, caller),
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

  fixTheFixables(
    data: object,
    collection: Collection,
    invalidFields: string[],
  ): {
    data: object;
    properties: {
      [key: string]: Property;
    };
    remainingInvalidFields?: string[];
  } {
    const properties = collection.properties;
    const fixedFields = {};
    for (const key of invalidFields) {
      if (fixedFields[key] || !collection.properties[key]) continue;
      switch (collection.properties[key].type) {
        case 'singleSelect':
          if (typeof data[key] === 'string' && data[key] !== '') {
            const existingOption = collection.properties[key].options.find(
              (option) => option.label === data[key],
            );
            if (existingOption) {
              data[key] = existingOption;
            } else {
              data[key] = {
                label: data[key],
                value: `${uuidv4()}`,
              };
              properties[key].options.push(data[key]);
            }
            fixedFields[key] = true;
          } else if (typeof data[key] === 'object' && data[key] !== null) {
            const existingOption = collection.properties[key].options.find(
              (option) => option.label === data[key].label,
            );
            if (existingOption) {
              data[key] = existingOption;
            } else {
              data[key] = {
                label: data[key].label,
                value: `${uuidv4()}`,
              };
              properties[key].options.push(data[key]);
            }
            fixedFields[key] = true;
          }
          continue;
        case 'multiSelect':
          if (Array.isArray(data[key])) {
            const existingOptions = collection.properties[key].options.filter(
              (option) => data[key].includes(option.label || option),
            );
            const nonExistingOptions = data[key].filter(
              (option) =>
                !collection.properties[key].options.find(
                  (existingOption) => existingOption.label === option,
                ),
            );
            const nonExistingOptionsValues = nonExistingOptions.map(
              (option) => ({
                label: option?.label || option,
                value: `${uuidv4()}`,
              }),
            );
            data[key] = [...existingOptions, ...nonExistingOptionsValues];
            properties[key].options.push(...nonExistingOptionsValues);
            fixedFields[key] = true;
          } else if (typeof data[key] === 'string' && data[key] !== '') {
            const existingOption = collection.properties[key].options.find(
              (option) => option.label === data[key],
            );
            if (existingOption) {
              data[key] = [existingOption];
            } else {
              data[key] = [
                {
                  label: data[key],
                  value: `${uuidv4()}`,
                },
              ];
              properties[key].options.push(data[key][0]);
            }
            fixedFields[key] = true;
          }
      }
    }
    return {
      data,
      properties,
      remainingInvalidFields: invalidFields.filter(
        (field) => !fixedFields[field],
      ),
    };
  }

  removeTheUnfixables(data: object, invalidFields: string[]) {
    for (const key of invalidFields) {
      delete data[key];
    }
    return data;
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { UpdatePropertyCommand } from '../impl/update-property.command';
import { Property } from 'src/collection/types/types';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';

@CommandHandler(UpdatePropertyCommand)
export class UpdatePropertyCommandHandler
  implements ICommandHandler<UpdatePropertyCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('UpdatePropertyCommandHandler');
  }

  async execute(command: UpdatePropertyCommand): Promise<Collection> {
    try {
      console.log('UpdatePropertyCommandHandler');
      const { updatePropertyCommandDto, caller, collectionId, propertyId } =
        command;
      const collection = await this.collectionRepository.findById(collectionId);

      if (!collection.properties || !collection.properties[propertyId])
        throw `Cannot find property with id ${propertyId}`;

      console.log({
        updatePropertyCommandDto,
        caller,
        collectionId,
        propertyId,
      });

      // Clear data where an option is removed
      if (updatePropertyCommandDto.options) {
        const optionValueSet = new Set([
          ...updatePropertyCommandDto.options.map((a) => a.value),
        ]);
        if (
          collection.data &&
          ['singleSelect', 'multiSelect'].includes(
            collection.properties[propertyId].type,
          ) &&
          ['singleSelect', 'multiSelect'].includes(
            updatePropertyCommandDto.type,
          )
        ) {
          for (const [id, data] of Object.entries(collection.data)) {
            {
              if (collection.properties[propertyId].type === 'singleSelect') {
                if (
                  data[propertyId] &&
                  !optionValueSet.has(data[propertyId].value)
                )
                  delete data[propertyId];
              } else {
                data[propertyId] = data[propertyId]?.filter((a) =>
                  optionValueSet.has(a.value),
                );
                console.log({ d2: data[propertyId] });
              }
            }
          }
        }
      }

      collection.data = this.handleClearance(
        collection.properties[propertyId],
        updatePropertyCommandDto,
        collection.data,
      );

      const propId = updatePropertyCommandDto.name
        ? updatePropertyCommandDto.name
        : propertyId;
      if (
        updatePropertyCommandDto.name &&
        updatePropertyCommandDto.name !== propertyId
      ) {
        if (collection.properties[updatePropertyCommandDto.name])
          throw `Property already existss`;
        if (collection.data)
          for (const [id, data] of Object.entries(collection.data)) {
            data[updatePropertyCommandDto.name] = data[propertyId];
            delete data[propertyId];
          }

        delete collection.properties[propertyId];
        const idx = collection.propertyOrder.indexOf(propertyId);
        collection.propertyOrder[idx] = updatePropertyCommandDto.name;
      }

      collection.properties[propId] = {
        ...collection.properties[propertyId],
        ...updatePropertyCommandDto,
      };
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          properties: collection.properties,
          propertyOrder: collection.propertyOrder,
          data: collection.data,
        },
      );

      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(null, updatedCollection),
      );
    } catch (error) {
      this.logger.error(
        `Failed updating property to collection with error: ${error}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed updating property to collection with error: ${error}',
        error.message,
      );
    }
  }

  handleClearance(
    prevProperty: Property,
    newProperty: Property,
    dataObj: MappedItem<object>,
  ) {
    console.log({ prevProperty }, { newProperty });
    if (prevProperty.type === newProperty.type || !newProperty.type) {
      return dataObj;
    }
    if (!dataObj) return dataObj;
    switch (prevProperty.type) {
      case 'shortText':
      case 'longText':
        switch (newProperty.type) {
          case 'number':
            const result = { ...dataObj };
            for (const [id, data] of Object.entries(dataObj)) {
              if (!isNaN(data[prevProperty.name])) {
                result[id][newProperty.name] = parseFloat(
                  data[prevProperty.name],
                );
              } else {
                delete result[id][newProperty.type];
              }
            }
            return result;
          default:
            return dataObj;
        }
      case 'number':
        if (
          newProperty.type === 'shortText' ||
          newProperty.type === 'longText'
        ) {
          const result = { ...dataObj };
          for (const [id, data] of Object.entries(dataObj)) {
            result[id][newProperty.type] = data[prevProperty.name].toString();
          }
          return result;
        }
        return this.clearAllData(prevProperty, dataObj);
      case 'ethAddress':
      case 'email':
      case 'date':
        if (newProperty.type === 'shortText' || newProperty.type === 'longText')
          return dataObj;
        else return this.clearAllData(prevProperty, dataObj);

      case 'singleSelect':
        if (newProperty.type === 'multiSelect') {
          const result = { ...dataObj };
          for (const [id, data] of Object.entries(dataObj)) {
            if (data[prevProperty.name]) {
              result[id][newProperty.name] = [data[prevProperty.name]];
            }
          }
          return result;
        }
        return this.clearAllData(prevProperty, dataObj);
      case 'user':
        if (newProperty.type === 'user[]') {
          const result = { ...dataObj };
          for (const [id, data] of Object.entries(dataObj)) {
            if (data[prevProperty.name]) {
              result[id][newProperty.name] = [data[prevProperty.name]];
            }
          }
          return result;
        }
        return this.clearAllData(prevProperty, dataObj);
      case 'multiSelect':
      case 'user[]':
      case 'reward':
      case 'milestone':
        return this.clearAllData(prevProperty, dataObj);

      default:
        console.log({ dataObj });
        return dataObj;
    }
  }

  clearAllData(property: Property, dataObj: MappedItem<object>) {
    for (const [id, data] of Object.entries(dataObj)) {
      delete data[property.name];
    }
    return dataObj;
  }
}

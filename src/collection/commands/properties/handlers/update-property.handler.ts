import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { UpdatePropertyCommand } from '../impl/update-property.command';
import { Property } from 'src/collection/types/types';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { ActivityBuilder } from 'src/collection/services/activity.service';
import { v4 as uuidV4 } from 'uuid';
import { UpdatePropertyDto } from 'src/collection/dto/update-property-request.dto';

@CommandHandler(UpdatePropertyCommand)
export class UpdatePropertyCommandHandler
  implements ICommandHandler<UpdatePropertyCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
    private readonly activityBuilder: ActivityBuilder,
  ) {
    this.logger.setContext('UpdatePropertyCommandHandler');
  }

  async execute(command: UpdatePropertyCommand): Promise<Collection> {
    try {
      console.log('UpdatePropertyCommandHandler');
      const { updatePropertyCommandDto, collectionId, propertyId, caller } =
        command;
      const collection = await this.collectionRepository.findById(collectionId);

      if (!collection.properties || !collection.properties[propertyId])
        throw `Cannot find property with id ${propertyId}`;

      if (updatePropertyCommandDto.name === 'slug')
        throw 'Cannot add property with name slug';

      this.removeUnwantedKeys(updatePropertyCommandDto);

      if (collection.collectionType === 0) {
        // dont allow property to be immutable after some data has been added
        if (
          updatePropertyCommandDto.immutable &&
          collection.properties[propertyId].immutable === false &&
          collection.data &&
          Object.values(collection.data).some((a) => a[propertyId])
        )
          throw 'Cannot make a property immutable after data has been added';

        // dont allow immutabality to be changed
        if (
          updatePropertyCommandDto.immutable === false &&
          collection.properties[propertyId].immutable
        )
          throw 'Cannot change immutability of an immutable property, you can delete the property and add it again';

        if (
          updatePropertyCommandDto.isPartOfFormView === false &&
          collection.properties[propertyId].immutable
        ) {
          throw 'Cannot remove a property from a form view if it is immutable, you can delete the property and add it again';
        }

        // clear data if field is immutable
        if (collection.properties[propertyId].immutable) {
          if (collection.data) {
            for (const [id, data] of Object.entries(collection.data)) {
              if (data[propertyId]) {
                delete data[propertyId];
                const activityId = uuidV4();
                const timestamp = new Date();
                collection.dataActivityOrder[id].push(activityId);
                collection.dataActivities[id][activityId] = {
                  content: `Deleted ${collection.properties[propertyId].name} data because immutable property was updated`,
                  ref: {
                    actor: {
                      id: caller,
                      refType: 'user',
                    },
                  },
                  timestamp,
                  comment: false,
                  imageRef: `${collection.properties[propertyId].type}Update`,
                };
              }
            }
          }
        }
      }

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
              }
            }
          }
        }
      }

      // check if property name changed
      // if (
      //   updatePropertyCommandDto.name &&
      //   updatePropertyCommandDto.name !== propertyId
      // ) {
      //   if (collection.projectMetadata.cardOrders) {
      //     for (const [id, cardOrder] of Object.entries(
      //       collection.projectMetadata.cardOrders,
      //     )) {
      //       if (id === propertyId) {
      //         console.log('updated group by column');
      //         collection.projectMetadata.cardOrders[
      //           updatePropertyCommandDto.name
      //         ] = cardOrder;
      //         delete collection.projectMetadata.cardOrders[id];
      //       }
      //     }
      //   }
      //   // change property name in all views
      //   collection.projectMetadata.viewOrder?.forEach((viewId) => {
      //     const view = collection.projectMetadata.views[viewId];
      //     if (view.groupByColumn === propertyId)
      //       view.groupByColumn = updatePropertyCommandDto.name;
      //     collection.projectMetadata.views[viewId] = view;
      //   });

      //   // change the property name in the page it contains
      //   if (collection.collectionType === 0 && collection.formMetadata.pages) {
      //     for (const [id, page] of Object.entries(
      //       collection.formMetadata.pages,
      //     )) {
      //       if (page?.properties) {
      //         const idx = page.properties.indexOf(propertyId);
      //         if (idx > -1) {
      //           page.properties[idx] = updatePropertyCommandDto.name;
      //         }
      //       }
      //       collection.formMetadata.pages[id] = page;
      //     }
      //   }
      // }

      // Update data where an option label is changed
      if (
        updatePropertyCommandDto.options &&
        collection.properties[propertyId].options
      ) {
        const optionLabelMap = new Map(
          updatePropertyCommandDto.options.map((a) => [a.value, a.label]),
        );
        if (
          collection.data &&
          ['singleSelect', 'multiSelect'].includes(
            collection.properties[propertyId].type,
          ) &&
          !updatePropertyCommandDto.type
        ) {
          for (const [id, data] of Object.entries(collection.data)) {
            {
              if (collection.properties[propertyId].type === 'singleSelect') {
                console.log({ d: data[propertyId] });
                if (data[propertyId]) {
                  data[propertyId].label = optionLabelMap.get(
                    data[propertyId].value,
                  );
                }
              } else {
                data[propertyId] = data[propertyId]?.map((a) => ({
                  ...a,
                  label: optionLabelMap.get(a.value),
                }));
              }
            }
          }
        }
      }

      // delete filter if property is there
      collection.projectMetadata.viewOrder?.forEach((viewId) => {
        const view = collection.projectMetadata.views[viewId];
        // delete view filters if the data field is the property name
        if (view.filters) {
          view.filters = view.filters.filter((a) => {
            return a.data.field.value !== propertyId;
          });
        }
        // delete view sort if the data field is the property name
        if (view.sort.property === propertyId) delete view.sort;
        collection.projectMetadata.views[viewId] = view;
      });

      collection.data = this.handleClearance(
        collection.properties[propertyId],
        updatePropertyCommandDto,
        collection.data,
      );

      // if (updatePropertyCommandDto.name) {
      //   if (collection.data)
      //     for (const [id, data] of Object.entries(collection.data)) {
      //       data[updatePropertyCommandDto.name] = data[propertyId];
      //       delete data[propertyId];
      //     }

      //   delete collection.properties[propertyId];
      //   const idx = collection.propertyOrder.indexOf(propertyId);
      //   collection.propertyOrder[idx] = updatePropertyCommandDto.name;
      // }

      if (
        collection.collectionType === 0 &&
        updatePropertyCommandDto.isPartOfFormView === false
      ) {
        // remove from responseDataForMintKuods if present and respondeDataForPoap
        if (collection.formMetadata?.responseDataForMintkudos?.[propertyId]) {
          delete collection.formMetadata.responseDataForMintkudos[propertyId];
          collection.formMetadata.minimumNumberOfAnswersThatNeedToMatchForMintkudos -= 1;
        }
        if (collection.formMetadata?.responseDataForPoap?.[propertyId]) {
          delete collection.formMetadata.responseDataForPoap[propertyId];
          collection.formMetadata.minimumNumberOfAnswersThatNeedToMatchForPoap -= 1;
        }
      }

      collection.properties[propertyId] = {
        ...collection.properties[propertyId],
        ...updatePropertyCommandDto,
      };
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          properties: collection.properties,
          propertyOrder: collection.propertyOrder,
          data: collection.data,
          projectMetadata: collection.projectMetadata,
          formMetadata: collection.formMetadata,
          dataActivities: collection.dataActivities,
          dataActivityOrder: collection.dataActivityOrder,
        },
      );

      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(updatedCollection.slug),
      );
    } catch (error) {
      this.logger.error(
        `Failed updating property to collection with error: ${error}`,
        command,
      );
      throw new InternalServerErrorException(
        `Failed updating property to collection with error: ${error}`,
        error.message,
      );
    }
  }

  handleClearance(
    prevProperty: Property,
    newProperty: Property,
    dataObj: MappedItem<object>,
  ) {
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
              if (!isNaN(data[prevProperty.id])) {
                result[id][newProperty.id] = parseFloat(data[prevProperty.id]);
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
            result[id][newProperty.type] = data[prevProperty.id].toString();
          }
          return result;
        }
        return this.clearAllData(prevProperty, dataObj);
      case 'ethAddress':
      case 'email':
      case 'singleURL':
      case 'date':
        if (newProperty.type === 'shortText' || newProperty.type === 'longText')
          return dataObj;
        else return this.clearAllData(prevProperty, dataObj);

      case 'singleSelect':
        if (newProperty.type === 'multiSelect') {
          const result = { ...dataObj };
          for (const [id, data] of Object.entries(dataObj)) {
            if (data[prevProperty.id]) {
              result[id][newProperty.id] = [data[prevProperty.id]];
            }
          }
          return result;
        }
        return this.clearAllData(prevProperty, dataObj);
      case 'user':
        if (newProperty.type === 'user[]') {
          const result = { ...dataObj };
          for (const [id, data] of Object.entries(dataObj)) {
            if (data[prevProperty.id]) {
              result[id][newProperty.id] = [data[prevProperty.id]];
            }
          }
          return result;
        }
        return this.clearAllData(prevProperty, dataObj);
      case 'multiSelect':
      case 'user[]':
      case 'reward':
      case 'multiURL':
      case 'milestone':
      case 'payWall':
        return this.clearAllData(prevProperty, dataObj);

      default:
        console.log({ dataObj });
        return dataObj;
    }
  }

  clearAllData(property: Property, dataObj: MappedItem<object>) {
    for (const [id, data] of Object.entries(dataObj)) {
      delete data[property.id];
    }
    return dataObj;
  }

  removeUnwantedKeys(updatePropertyCommandDto: UpdatePropertyDto) {
    switch (updatePropertyCommandDto.type) {
      case 'slider':
        delete updatePropertyCommandDto.options;
        delete updatePropertyCommandDto.payWallOptions;
        delete updatePropertyCommandDto.rewardOptions;
        delete updatePropertyCommandDto.milestoneFields;
        delete updatePropertyCommandDto.onUpdateNotifyUserTypes;
        delete updatePropertyCommandDto.allowCustom;
        delete updatePropertyCommandDto.maxSelections;
        break;
      default:
        break;
    }
  }
}

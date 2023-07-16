import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ethers } from 'ethers';
import mongoose from 'mongoose';
import { HasSatisfiedAdvancedDataConditionsQuery } from 'src/automation/queries/impl';
import { MappedItem } from 'src/common/interfaces';
import { isValidDateString } from 'src/common/validators/isDateString.validator';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionRepository } from '../collection.repository';
import { Collection } from '../model/collection.model';
import { Property } from '../types/types';

@Injectable()
export class DataValidationService {
  constructor(
    private readonly collectionRepositor: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('DataValidationService');
  }

  async validate(
    dataObj: object,
    operation: 'update' | 'add',
    skipRequiredFieldValidation?: boolean,
    collection?: Collection,
    collectionId?: string,
  ) {
    let collectionToValidate = collection;
    if (!collectionToValidate)
      collectionToValidate = await this.collectionRepositor.findById(
        collectionId,
      );
    if (!collectionToValidate) throw 'Collection not found';

    const propertyValidationPassed = this.validateProperty(
      dataObj,
      collectionToValidate.properties,
    );
    console.log({ propertyValidationPassed });
    if (!propertyValidationPassed) return false;

    const typeValidationPassed = this.validateType(
      dataObj,
      collectionToValidate.properties,
    );
    if (!typeValidationPassed) return false;
    console.log({ typeValidationPassed });

    if (!skipRequiredFieldValidation) {
      const requiredValidationPassed = await this.validateRequriedFields(
        dataObj,
        collectionToValidate,
        operation,
      );
      if (!requiredValidationPassed) return false;
      console.log({ requiredValidationPassed });
    }

    return true;
  }

  private validateProperty(
    dataObj: object,
    properties: MappedItem<Property>,
  ): boolean {
    for (const [propertyId, data] of Object.entries(dataObj)) {
      if (
        propertyId === '__payment__' ||
        propertyId === '__cardStatus__' ||
        propertyId === '__ceramic__'
      )
        continue;
      if (!properties[propertyId]) {
        return false;
      }
    }
    return true;
  }

  private validateType(
    dataObj: object,
    properties: MappedItem<Property>,
  ): boolean {
    for (const [propertyId, data] of Object.entries(dataObj)) {
      if (data === null) continue;
      if (
        propertyId === '__payment__' ||
        propertyId === '__cardStatus__' ||
        propertyId === '__ceramic__'
      )
        continue;
      if (['shortText', 'longText'].includes(properties[propertyId].type)) {
        if (typeof data !== 'string') {
          throw "Data type should be 'string'";
        }
      } else if (
        ['singleSelect', 'slider'].includes(properties[propertyId].type)
      ) {
        if (typeof data !== 'object') return false;
        if (Object.keys(data)?.length && (!data['value'] || !data['label']))
          throw "Single select data type doesn't match";
      } else if (['multiSelect'].includes(properties[propertyId].type)) {
        if (!Array.isArray(data)) return false;
        for (const elem of data) {
          if (!elem['value'] || !elem['label'])
            throw "Multi select data type doesn't match";
        }
      } else if (['number'].includes(properties[propertyId].type)) {
        if (typeof data !== 'number') throw "Data type should be 'number'";
      } else if (['reward'].includes(properties[propertyId].type)) {
        if (data && data['value']) {
          if (
            typeof data['token'] !== 'object' ||
            typeof data['chain'] !== 'object' ||
            typeof data['value'] !== 'number' ||
            typeof data['chain']['label'] !== 'string' ||
            typeof data['chain']['value'] !== 'string' ||
            typeof data['token']['label'] !== 'string' ||
            typeof data['token']['value'] !== 'string'
          )
            throw "Reward data type doesn't match";
        }
      }
      // else if (['ethAddress'].includes(properties[propertyId].type)) {
      //   if (data && !ethers.utils.isAddress(data))
      //     throw 'Invalid ethereum address';
      // }
      else if (['user'].includes(properties[propertyId].type)) {
        if (data && data.value && !mongoose.isValidObjectId(data.value))
          throw 'Invalid user';
      } else if (['user[]'].includes(properties[propertyId].type)) {
        if (data)
          for (const user of data)
            if (!mongoose.isValidObjectId(user.value))
              throw 'Invalid multi user data type';
      } else if (['email'].includes(properties[propertyId].type)) {
        if (
          data &&
          !String(data)
            .toLowerCase()
            .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            )
        )
          throw 'Invalid email address';
      } else if (['milestone'].includes(properties[propertyId].type)) {
        if (data)
          for (const milestone of data) {
            if (!milestone['title']) return false;
            const reward = milestone['reward'];
            if (reward && reward['value']) {
              if (
                typeof reward['token'] !== 'object' ||
                typeof reward['chain'] !== 'object' ||
                typeof reward['value'] !== 'number' ||
                typeof reward['chain']['label'] !== 'string' ||
                typeof reward['chain']['value'] !== 'string' ||
                typeof reward['token']['label'] !== 'string' ||
                typeof reward['token']['value'] !== 'string'
              )
                throw "Milestone data type doesn't match";
            }
          }
      } else if (['singleURL'].includes(properties[propertyId].type)) {
        if (
          data &&
          !String(data)
            .toLowerCase()
            .match(/((?:https?:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)
        )
          throw 'Invalid URL';
      } else if (['multiURL'].includes(properties[propertyId].type)) {
        if (data)
          for (const url of data) {
            if (
              url['value'] &&
              !String(url['value'])
                .toLowerCase()
                .match(/((?:https?:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)
            )
              throw 'Invalid URL(s)';
          }
      } else if (['payWall'].includes(properties[propertyId].type)) {
        if (data) {
          for (const payment of data) {
            if (
              typeof payment['token'] !== 'object' ||
              typeof payment['chain'] !== 'object' ||
              typeof payment['chain']['label'] !== 'string' ||
              typeof payment['chain']['value'] !== 'string' ||
              typeof payment['token']['label'] !== 'string' ||
              typeof payment['token']['value'] !== 'string' ||
              typeof payment['txnHash'] !== 'string' ||
              typeof payment['paid'] !== 'boolean'
            ) {
              throw "Paywall data type doesn't match";
            }
          }
        }
      } else if (['ethAddress'].includes(properties[propertyId].type)) {
        if (data) {
          const validEns =
            data.endsWith('.eth') && data.replace('.eth', '').length >= 3;
          if (!ethers.utils.isAddress(data) && !validEns)
            throw 'Invalid ethereum address or ens';
        }
      } else if (['date'].includes(properties[propertyId].type)) {
        if (data) {
          if (!isValidDateString(data)) {
            throw 'Invalid date';
          }
        }
      } else if (['discord'].includes(properties[propertyId].type)) {
        if (data) {
          if (typeof data === 'string') {
          } else if (typeof data === 'object') {
            if (!data.id || !data.username)
              throw "Discord data type doesn't match, must contain id or username";
          } else
            throw "Internal error: Discord data type doesn't match, must be object or string";
        }
      }
    }
    return true;
  }

  private async validateRequriedFields(
    dataObj: object,
    collection: Collection,
    operation: 'update' | 'add',
  ): Promise<boolean> {
    for (const [propertyId, property] of Object.entries(
      collection.properties,
    )) {
      if (property.type === 'readonly' || !property.isPartOfFormView) continue;
      let satisfiedConditions = true;
      if (property.advancedConditions?.order?.length)
        satisfiedConditions = await this.queryBus.execute(
          new HasSatisfiedAdvancedDataConditionsQuery(
            collection,
            dataObj || {},
            property.advancedConditions,
          ),
        );
      if (property.required && satisfiedConditions) {
        if (
          operation === 'update' &&
          propertyId in dataObj &&
          (dataObj[propertyId] === undefined || dataObj[propertyId] === '')
        ) {
          return false;
        } else if (
          operation === 'add' &&
          (dataObj[propertyId] === undefined || dataObj[propertyId] === '')
        ) {
          return false;
        }
      }
    }
    return true;
  }

  async validateRequiredFieldForFieldsThatExist(
    collection: Collection,
    dataObj: object,
    operation: 'update' | 'add',
  ): Promise<boolean> {
    for (const [propertyId, property] of Object.entries(dataObj)) {
      let satisfiedConditions = true;
      if (property.advancedConditions?.order)
        satisfiedConditions = await this.queryBus.execute(
          new HasSatisfiedAdvancedDataConditionsQuery(
            collection,
            dataObj || {},
            property.advancedConditions,
          ),
        );
      if (property.required && satisfiedConditions) {
        if (
          operation === 'update' &&
          propertyId in dataObj &&
          !dataObj[propertyId]
        ) {
          return false;
        } else if (operation === 'add' && !dataObj[propertyId]) return false;
      }
    }
    return true;
  }

  validatePartialRewardData(rewardFields: { [key: string]: object }): boolean {
    for (const data of Object.values(rewardFields)) {
      if (data) {
        if (
          data['chain'] &&
          (!data['chain']['label'] || !data['chain']['value'])
        ) {
          throw "Chain data type doesn't match";
        }
        if (
          data['token'] &&
          (!data['token']['label'] || !data['token']['value'])
        ) {
          throw "Token data type doesn't match";
        }
        if (data['value'] && typeof data['value'] !== 'number') {
          throw "Value data type doesn't match";
        }
      }
    }

    return true;
  }

  validatePartialMilestoneData(milestoneFields: {
    [key: string]: object;
  }): boolean {
    for (const data of Object.values(milestoneFields)) {
      if (data) {
        if (!data['title']) return false;
        if (data['dueDate'] && !isValidDateString(data['dueDate'])) {
          console.log({ valid: isValidDateString(data['dueDate']) });
          throw 'Invalid date';
        }
        const reward = data['reward'];
        if (reward) {
          if (
            reward['chain'] &&
            (!reward['chain']['label'] || !reward['chain']['value'])
          ) {
            throw "Chain data type doesn't match";
          }
          if (
            reward['token'] &&
            (!reward['token']['label'] || !reward['token']['value'])
          ) {
            throw "Token data type doesn't match";
          }
          if (reward['value'] && typeof reward['value'] !== 'number') {
            throw "Value data type doesn't match";
          }
        }
      }
    }

    return true;
  }
}

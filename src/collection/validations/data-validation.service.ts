import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionRepository } from '../collection.repository';
import { Collection } from '../model/collection.model';
import { Property } from '../types/types';
import { ethers } from 'ethers';
import mongoose from 'mongoose';
import { QueryBus } from '@nestjs/cqrs';
import { HasSatisfiedDataConditionsQuery } from 'src/automation/queries/impl';

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
    try {
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

      const valueValidationPassed = this.validateValue(
        dataObj,
        collectionToValidate.properties,
      );
      if (!valueValidationPassed) return false;
      console.log({ valueValidationPassed });

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
    } catch (err) {
      this.logger.error(
        `Validating data in collection failed with error ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Validating data in collection failed with error ${err.message}`,
      );
    }
  }

  private validateProperty(
    dataObj: object,
    properties: MappedItem<Property>,
  ): boolean {
    for (const [propertyId, data] of Object.entries(dataObj)) {
      if (!properties[propertyId]) {
        console.log({ propertyId, data });
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
      console.log({ data });
      console.log({ propertyId });

      if (['shortText', 'longText'].includes(properties[propertyId].type)) {
        if (typeof data !== 'string') return false;
      } else if (['singleSelect'].includes(properties[propertyId].type)) {
        if (typeof data !== 'object') return false;
        if (Object.keys(data)?.length && (!data['value'] || !data['label']))
          return false;
      } else if (['multiSelect'].includes(properties[propertyId].type)) {
        if (!Array.isArray(data)) return false;
        for (const elem of data) {
          if (!elem['value'] || !elem['label']) return false;
        }
      } else if (['number'].includes(properties[propertyId].type)) {
        if (typeof data !== 'number') return false;
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
            return false;
        }
      } else if (['ethAddress'].includes(properties[propertyId].type)) {
        if (data && !ethers.utils.isAddress(data)) return false;
      } else if (['user'].includes(properties[propertyId].type)) {
        if (data && data.value && !mongoose.isValidObjectId(data.value))
          return false;
      } else if (['user[]'].includes(properties[propertyId].type)) {
        if (data)
          for (const user of data)
            if (!mongoose.isValidObjectId(user.value)) return false;
      } else if (['email'].includes(properties[propertyId].type)) {
        if (
          data &&
          !String(data)
            .toLowerCase()
            .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            )
        )
          return false;
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
                return false;
            }
          }
      } else if (['singleURL'].includes(properties[propertyId].type)) {
        if (
          data &&
          !String(data)
            .toLowerCase()
            .match(/((?:https?:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)
        )
          return false;
      } else if (['multiURL'].includes(properties[propertyId].type)) {
        if (data)
          for (const url of data) {
            if (
              url &&
              !String(url)
                .toLowerCase()
                .match(/((?:https?:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)
            )
              return false;
          }
      } else if (['payWall'].includes(properties[propertyId].type)) {
        if (data && data['network']) {
          const network = data['network'];
          if (
            typeof network['token'] !== 'object' ||
            typeof network['chain'] !== 'object' ||
            typeof network['chain']['label'] !== 'string' ||
            typeof network['chain']['value'] !== 'string' ||
            typeof network['token']['label'] !== 'string' ||
            typeof network['token']['value'] !== 'string' ||
            typeof data['txnHash'] !== 'string' ||
            typeof data['paid'] !== 'boolean'
          )
            return false;
        }
      }
    }
    return true;
  }

  private validateValue(
    dataObj: object,
    properties: MappedItem<Property>,
  ): boolean {
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
      let satisfiedConditions = true;
      if (property.viewConditions)
        satisfiedConditions = await this.queryBus.execute(
          new HasSatisfiedDataConditionsQuery(
            collection,
            dataObj || {},
            property.viewConditions,
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
}

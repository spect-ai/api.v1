import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionRepository } from '../collection.repository';
import { Collection } from '../model/collection.model';
import { Property } from '../types/types';
import { ethers } from 'ethers';
import mongoose from 'mongoose';

@Injectable()
export class DataValidationService {
  constructor(
    private readonly collectionRepositor: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('DataValidationService');
  }

  async validate(
    dataObj: object,
    operation: 'update' | 'add',
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
      console.log(typeValidationPassed);

      const valueValidationPassed = this.validateValue(
        dataObj,
        collectionToValidate.properties,
      );
      if (!valueValidationPassed) return false;
      console.log(valueValidationPassed);

      const requiredValidationPassed = this.validateRequriedFields(
        dataObj,
        collectionToValidate.properties,
        operation,
      );
      if (!requiredValidationPassed) return false;
      console.log(valueValidationPassed);

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
      if (['shortText', 'longText'].includes(properties[propertyId].type)) {
        if (typeof data !== 'string') return false;
      } else if (['singleSelect'].includes(properties[propertyId].type)) {
        if (typeof data !== 'object') return false;
        if (!data['value'] || !data['label']) return false;
      } else if (['multiSelect'].includes(properties[propertyId].type)) {
        if (!Array.isArray(data)) return false;
        for (const elem of data) {
          if (!elem['value'] || !elem['label']) return false;
        }
      } else if (['number'].includes(properties[propertyId].type)) {
        if (typeof data !== 'number') return false;
      } else if (['reward'].includes(properties[propertyId].type)) {
        if (
          typeof data['token'] !== 'object' ||
          typeof data['chain'] !== 'object' ||
          typeof data['value'] !== 'number' ||
          typeof data['chain']['chainId'] !== 'string' ||
          typeof data['chain']['name'] !== 'string' ||
          typeof data['token']['symbol'] !== 'string' ||
          typeof data['token']['address'] !== 'string'
        )
          return false;
      } else if (['ethAddress'].includes(properties[propertyId].type)) {
        if (!ethers.utils.isAddress(data)) return false;
      } else if (['user'].includes(properties[propertyId].type)) {
        if (!mongoose.isValidObjectId(data.value)) return false;
      } else if (['user[]'].includes(properties[propertyId].type)) {
        for (const user of data)
          if (!mongoose.isValidObjectId(user.value)) return false;
      } else if (['email'].includes(properties[propertyId].type)) {
        if (
          String(data)
            .toLowerCase()
            .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            )
        )
          return false;
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

  private validateRequriedFields(
    dataObj: object,
    properties: MappedItem<Property>,
    operation: 'update' | 'add',
  ): boolean {
    for (const [propertyId, property] of Object.entries(properties)) {
      if (property.required) {
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

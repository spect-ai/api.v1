import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionRepository } from '../collection.repository';
import { Collection } from '../model/collection.model';
import { Property } from '../types/types';

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
      console.log(propertyValidationPassed);
      if (!propertyValidationPassed) return false;

      const valueValidationPassed = this.validateValue(
        dataObj,
        collectionToValidate.properties,
      );
      if (!valueValidationPassed) return false;
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
    console.log({ dataObj, properties });
    for (const [propertyId, data] of Object.entries(dataObj)) {
      if (!properties[propertyId]) return false;
    }
    return true;
  }

  private validateValue(
    dataObj: object,
    properties: MappedItem<Property>,
  ): boolean {
    for (const [propertyId, data] of Object.entries(dataObj)) {
      if (['shortText', 'longText'].includes(properties[propertyId].type)) {
        if (typeof data !== 'string') return false;
      } else if (['singleSelect'].includes(properties[propertyId].type)) {
        if (typeof data !== 'object') return false;
        if (!data['value'] || !data['label']) return false;
      } else if (['multiSelect'].includes(properties[propertyId].type)) {
        if (!Array.isArray(data)) return false;
        for (const elem of data) {
          if (!data['value'] || !data['label']) return false;
        }
      } else if (['number'].includes(properties[propertyId].type)) {
        if (typeof data !== 'number') return false;
      }
    }
    return true;
  }
}

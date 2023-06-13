import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import mongoose from 'mongoose';
import { MappedItem } from 'src/common/interfaces';
import { isValidDateString } from 'src/common/validators/isDateString.validator';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionRepository } from '../../collection.repository';
import { Collection } from '../../model/collection.model';
import { Property } from '../../types/types';

@Injectable()
export class ProjectDataValidationV2Service {
  constructor(
    private readonly collectionRepositor: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ProjectDataValidationV2Service');
  }

  async validate(
    dataObj: object,
    collection?: Collection,
    collectionId?: string,
    returnInvalidFieldsAndDontThrowError = false,
  ): Promise<
    boolean | { invalidProperties: string[]; invalidTypes: string[] }
  > {
    let collectionToValidate = collection;
    if (!collectionToValidate)
      collectionToValidate = await this.collectionRepositor.findById(
        collectionId,
      );
    if (!collectionToValidate) throw 'Collection not found';
    console.log({ returnInvalidFieldsAndDontThrowError });
    const propertyValidationResults = this.validateProperty(
      dataObj,
      collectionToValidate.properties,
      returnInvalidFieldsAndDontThrowError,
    );

    const typeValidationResults = this.validateType(
      dataObj,
      collectionToValidate.properties,
      returnInvalidFieldsAndDontThrowError,
    );

    if (returnInvalidFieldsAndDontThrowError)
      return {
        invalidProperties: propertyValidationResults as string[],
        invalidTypes: typeValidationResults as string[],
      };

    return true;
  }

  private validateProperty(
    dataObj: object,
    properties: MappedItem<Property>,
    returnInvalidFieldsAndDontThrowError = false,
  ): boolean | string[] {
    const invalidFields = [];
    for (const [propertyId, data] of Object.entries(dataObj)) {
      if (
        propertyId === '__payment__' ||
        propertyId === '__cardStatus__' ||
        propertyId === '__ceramic__'
      )
        continue;
      try {
        if (!properties[propertyId]) {
          throw `Property ${propertyId} not found`;
        }
      } catch (err) {
        if (returnInvalidFieldsAndDontThrowError)
          invalidFields.push(propertyId);
        else throw err;
      }
    }
    if (returnInvalidFieldsAndDontThrowError) return invalidFields;
    return true;
  }

  private validateType(
    dataObj: object,
    properties: MappedItem<Property>,
    returnInvalidFieldsAndDontThrowError = false,
  ): boolean | string[] {
    const invalidFields = [];
    for (const [propertyId, data] of Object.entries(dataObj)) {
      try {
        if (data === null) continue;
        if (
          propertyId === '__payment__' ||
          propertyId === '__cardStatus__' ||
          propertyId === '__ceramic__'
        )
          continue;

        switch (properties[propertyId].type) {
          case 'shortText':
          case 'longText':
            if (typeof data !== 'string') {
              throw "Data type should be 'string'";
            }
            continue;
          case 'singleSelect':
            if (typeof data !== 'object') throw "Data type should be 'object'";
            if (Object.keys(data)?.length && (!data['value'] || !data['label']))
              throw "Single select data type doesn't match, must contain value and label";
            continue;
          case 'multiSelect':
            if (!Array.isArray(data)) throw "Data type should be 'array'";
            for (const elem of data) {
              if (!elem['value'] || !elem['label'])
                throw "Multi select data type doesn't match";
            }
            continue;
          case 'number':
            if (typeof data !== 'number') throw "Data type should be 'number'";
          case 'reward':
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
          case 'user':
            if (data && data.value && !mongoose.isValidObjectId(data.value))
              throw 'Invalid user';
            continue;
          case 'user[]':
            if (data)
              for (const user of data)
                if (!mongoose.isValidObjectId(user.value))
                  throw 'Invalid multi user data type';
            continue;
          case 'email':
            if (
              data &&
              !String(data)
                .toLowerCase()
                .match(
                  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                )
            )
              throw 'Invalid email address';
            continue;
          case 'singleURL':
            if (
              data &&
              !String(data)
                .toLowerCase()
                .match(/((?:https?:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)
            )
              throw 'Invalid URL';
            continue;
          case 'ethAddress':
            if (data) {
              const validEns =
                data.endsWith('.eth') && data.replace('.eth', '').length >= 3;
              if (!ethers.utils.isAddress(data) && !validEns)
                throw 'Invalid ethereum address or ens';
            }
            continue;
          case 'date':
            if (data) {
              if (!isValidDateString(data)) {
                throw 'Invalid date';
              }
            }
            continue;
          case 'discord':
            if (!data.match(/#\d{4}$/)) throw "Discord data type doesn't match";
            continue;
        }
      } catch (e) {
        if (returnInvalidFieldsAndDontThrowError)
          invalidFields.push(propertyId);
        else throw e;
      }
    }
    if (returnInvalidFieldsAndDontThrowError) return invalidFields;
    return true;
  }
}

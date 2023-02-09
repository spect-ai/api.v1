import { Injectable } from '@nestjs/common';
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
      if (propertyId === '__payment__' || propertyId === '__cardStatus__')
        continue;
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
      if (propertyId === '__payment__' || propertyId === '__cardStatus__')
        continue;
      if (['shortText', 'longText'].includes(properties[propertyId].type)) {
        if (typeof data !== 'string') {
          throw Error("Data type should be 'string'");
        }
      } else if (['singleSelect'].includes(properties[propertyId].type)) {
        if (typeof data !== 'object') return false;
        if (Object.keys(data)?.length && (!data['value'] || !data['label']))
          throw Error("Single select data type doesn't match");
      } else if (['multiSelect'].includes(properties[propertyId].type)) {
        if (!Array.isArray(data)) return false;
        for (const elem of data) {
          if (!elem['value'] || !elem['label'])
            throw Error("Multi select data type doesn't match");
        }
      } else if (['number'].includes(properties[propertyId].type)) {
        if (typeof data !== 'number')
          throw Error("Data type should be 'number'");
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
            throw new Error("Reward data type doesn't match");
        }
      } else if (['ethAddress'].includes(properties[propertyId].type)) {
        if (data && !ethers.utils.isAddress(data))
          throw new Error('Invalid ethereum address');
      } else if (['user'].includes(properties[propertyId].type)) {
        if (data && data.value && !mongoose.isValidObjectId(data.value))
          throw new Error('Invalid user');
      } else if (['user[]'].includes(properties[propertyId].type)) {
        if (data)
          for (const user of data)
            if (!mongoose.isValidObjectId(user.value))
              throw new Error('Invalid multi user data type');
      } else if (['email'].includes(properties[propertyId].type)) {
        if (
          data &&
          !String(data)
            .toLowerCase()
            .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            )
        )
          throw new Error('Invalid email address');
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
                throw new Error("Milestone data type doesn't match");
            }
          }
      } else if (['singleURL'].includes(properties[propertyId].type)) {
        if (
          data &&
          !String(data)
            .toLowerCase()
            .match(/((?:https?:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)
        )
          throw new Error('Invalid URL');
      } else if (['multiURL'].includes(properties[propertyId].type)) {
        if (data)
          for (const url of data) {
            if (
              url['value'] &&
              !String(url['value'])
                .toLowerCase()
                .match(/((?:https?:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)
            )
              throw new Error('Invalid URL(s)');
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
              throw new Error("Paywall data type doesn't match");
            }
          }
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

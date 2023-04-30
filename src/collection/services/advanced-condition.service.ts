import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Collection } from '../model/collection.model';
import { Option } from '../types/types';

@Injectable()
export class AdvancedConditionService {
  constructor(private readonly queryBus: QueryBus) {}

  hasMetResponseCountCondition(
    collection: Collection,
    data: any,
    responseData: any,
    minimumMatchCount: number,
  ): {
    canClaim: boolean;
    matchCount: number;
  } {
    if (!data)
      return {
        canClaim: false,
        matchCount: 0,
      };
    let matchCount = 0;
    let canClaim = false;
    for (const [propertyId, value] of Object.entries(responseData)) {
      if (['number', 'date'].includes(collection.properties[propertyId].type)) {
        if (data[propertyId] === value) {
          matchCount++;
        }
      } else if (collection.properties[propertyId].type === 'singleSelect') {
        if (data[propertyId].value === (value as Option)?.value) {
          matchCount++;
        }
      } else if (collection.properties[propertyId].type === 'multiSelect') {
        const responseDataValues = (value as Option[]).map((v) => v.value);
        const dataValues = (data[propertyId] as Option[]).map((v) => v.value);

        if (
          responseDataValues &&
          dataValues &&
          responseDataValues.length === dataValues.length &&
          responseDataValues.every((v) => dataValues.includes(v))
        ) {
          matchCount++;
        }
      }

      if (matchCount >= minimumMatchCount) {
        canClaim = true;
        break;
      }
    }
    return {
      canClaim,
      matchCount,
    };
  }
}

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
    for (const [propertyName, value] of Object.entries(data)) {
      if (!collection.properties[propertyName]) continue;
      if (
        ['number', 'date'].includes(collection.properties[propertyName].type)
      ) {
        if (responseData[propertyName] === value) {
          matchCount++;
        }
      } else if (collection.properties[propertyName].type === 'singleSelect') {
        if (responseData[propertyName].value === (value as Option)?.value) {
          matchCount++;
        }
      } else if (collection.properties[propertyName].type === 'multiSelect') {
        const responseDataValues = responseData[propertyName]?.map(
          (v) => v.value,
        );
        const dataValues = (value as Option[]).map((v) => v.value);

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

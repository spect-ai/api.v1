import { Injectable } from '@nestjs/common';
import { detailedDiff as objectDiff } from 'deep-object-diff';
import { diff as arrayDiff } from 'fast-array-diff';

@Injectable()
export class CommonTools {
  objectify(arrOfObjects: any[], key: string) {
    const res = {};
    for (const obj of arrOfObjects) {
      res[obj[key]] = obj;
    }

    return res;
  }

  arrayify(arrOfObjects: any[], key: string) {
    let res = [];
    for (const obj of arrOfObjects) {
      res = [...res, ...obj[key]];
    }
    return res;
  }

  distinctify(arrOfObjects: any[], uniqueKey: string) {
    const keyExists = {};
    const newArrOdObjects = [] as any[];
    for (const obj of arrOfObjects) {
      if (!keyExists[obj[uniqueKey]]) {
        keyExists[obj[uniqueKey]] = true;
        newArrOdObjects.push(obj);
      }
    }
    return newArrOdObjects;
  }

  mergeObjects(obj1: object, obj2: object, obj3?: object) {
    let res;
    if (obj3) {
      res = { ...obj1, ...obj2, ...obj3 };
    } else {
      res = { ...obj1, ...obj2 };
    }
    return res;
  }

  collateifyBooleanFields(arrOfObjects: any[], operator = 'or') {
    const res = {};
    for (const obj of arrOfObjects) {
      for (const [key, val] of Object.entries(obj)) {
        if (!res[key]) {
          res[key] = val;
        } else {
          if (operator === 'or') {
            res[key] = res[key] || val;
          } else if (operator === 'and') {
            res[key] = res[key] && val;
          }
        }
      }
    }
    return res;
  }

  setOrAggregateObjectKey(obj: object, key: string, value: number) {
    if (key in obj) {
      obj[key] += value;
    } else {
      obj[key] = value;
    }
    return obj;
  }

  setOrAppend(obj: object, key: string, value: any) {
    if (key in obj) {
      obj[key] = [...obj[key], value];
    } else {
      obj[key] = [value];
    }
    return obj;
  }

  removeFromArray(obj: object, key: string, value: any) {
    if (key in obj) {
      return obj[key].filter((item) => item !== value);
    } else {
      return obj;
    }
  }

  findDifference(obj1: object | any[], obj2: object | any[]) {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return arrayDiff(obj1, obj2);
    } else if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      return objectDiff(obj1, obj2);
    } else {
      throw new Error('Invalid input to findDifference');
    }
  }
}

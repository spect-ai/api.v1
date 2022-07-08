import { Injectable } from '@nestjs/common';

@Injectable()
export class DataStructureManipulationService {
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

  deepCollateify(obj1: object, obj2: object) {
    for (const [key, val] of Object.entries(obj2)) {
      if (obj1.hasOwnProperty(key)) {
        if (typeof obj1[key] === 'object') {
          obj1[key] = this.deepCollateify(obj1[key], val);
        } else {
          obj1[key] = val;
        }
      } else {
        obj1[key] = val;
      }
    }
    return obj1;
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

  collateifyTwoObjects(obj1: object, obj2: object) {
    const res = {};
    for (const [key, val] of Object.entries(obj1)) {
      res[key] = val;
    }
    for (const [key, val] of Object.entries(obj2)) {
      res[key] = val;
    }
    return res;
  }

  collateifyObjectOfObjects(obj1: object, obj2: object) {
    for (const [key, val] of Object.entries(obj2)) {
      if (obj1.hasOwnProperty(key)) {
        obj1[key] = {
          ...obj1[key],
          ...val,
        };
      } else {
        obj1[key] = val;
      }
    }
    return obj1;
  }

  setOrAggregateObjectKey(obj: object, key: string, value: number) {
    if (key in obj) {
      obj[key] += value;
    } else {
      obj[key] = value;
    }
    return obj;
  }
}

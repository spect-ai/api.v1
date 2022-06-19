import { Injectable } from '@nestjs/common';
import * as urlSlug from 'url-slug';

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
      console.log(`obj[key]`);

      console.log(obj[key]);
      res = [...res, ...obj[key]];
    }
    console.log(res);
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
}

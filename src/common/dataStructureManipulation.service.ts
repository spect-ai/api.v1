import { Injectable } from '@nestjs/common';
import * as urlSlug from 'url-slug';

@Injectable()
export class DataStructureManipulationService {
  async objectify(arrOfObjects: any[], key: string) {
    const res = {};
    for (const obj of arrOfObjects) {
      res[obj[key]] = obj;
    }
    return res;
  }
}

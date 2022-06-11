import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Circle } from './model/circle.model';

@Injectable()
export class CirclesRepository extends BaseRepository<Circle> {
  constructor(@InjectModel(Circle) ethAdressModel) {
    super(ethAdressModel);
  }

  async getParentCircles(): Promise<Circle[]> {
    return await this.findAll({ parents: { $exists: true, $eq: [] } });
  }
}

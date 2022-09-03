import { Injectable } from '@nestjs/common';
import { UpdateQuery } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { CirclePrivate } from './model/circle-private.model';

@Injectable()
export class CirclesPrivateRepository extends BaseRepository<CirclePrivate> {
  constructor(@InjectModel(CirclePrivate) circleModel) {
    super(circleModel);
  }
}

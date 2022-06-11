import { Injectable } from '@nestjs/common';
import { Circle } from './dto/circle.dto';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { CreateCircleDto } from './dto/create-circle.dto';

@Injectable()
export class CirclesService {
  constructor(
    @InjectModel(Circle)
    private readonly circleModel: ReturnModelType<typeof Circle>,
  ) {}

  async create(createCircleDto: CreateCircleDto): Promise<Circle> {
    const createdCircle = new this.circleModel(createCircleDto);
    createdCircle.entityId = 'entityId';
    console.log(createdCircle);
    return await createdCircle.save();
  }
}

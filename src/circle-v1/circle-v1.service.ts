import { Injectable } from '@nestjs/common';
import { CreateCircleV1RequestDto } from './dto/create-circle-v1.dto';
import { UpdateCircleV1RequestDto } from './dto/update-circle-v1.dto';

@Injectable()
export class CircleV1Service {
  create(createCircleV1Dto: CreateCircleV1RequestDto) {
    return 'This action adds a new circleV1';
  }

  findAll() {
    return `This action returns all circleV1`;
  }

  findOne(id: number) {
    return `This action returns a #${id} circleV1`;
  }

  update(id: number, updateCircleV1Dto: UpdateCircleV1RequestDto) {
    return `This action updates a #${id} circleV1`;
  }

  remove(id: number) {
    return `This action removes a #${id} circleV1`;
  }
}

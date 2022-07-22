import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CircleV1Service } from './circle-v1.service';
import { CreateCircleV1RequestDto } from './dto/create-circle-v1.dto';
import { UpdateCircleV1RequestDto } from './dto/update-circle-v1.dto';
import { QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from './queries/impl';
import { Circle } from './model/circle-v1.model';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';

@Controller('circle/v1')
export class CircleV1Controller {
  constructor(
    private readonly circleV1Service: CircleV1Service,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(@Body() createCircleV1Dto: CreateCircleV1RequestDto) {
    return this.circleV1Service.create(createCircleV1Dto);
  }

  @Get()
  findAll() {
    return this.circleV1Service.findAll();
  }

  @Get('/:id')
  async findByObjectId(@Param() param: ObjectIdDto): Promise<Circle> {
    return await this.queryBus.execute(new GetCircleByIdQuery(param.id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCircleV1Dto: UpdateCircleV1RequestDto,
  ) {
    return this.circleV1Service.update(+id, updateCircleV1Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.circleV1Service.remove(+id);
  }
}

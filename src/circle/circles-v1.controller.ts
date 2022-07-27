import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { CirclesService } from './circles.service';
import { Circle } from './model/circle.model';
import { GetCircleByIdQuery } from './queries/impl';

@Controller('circle/v1')
export class CircleV1Controller {
  constructor(
    private readonly circleService: CirclesService,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/:id')
  async findByObjectId(@Param() param: ObjectIdDto): Promise<Circle> {
    return await this.queryBus.execute(new GetCircleByIdQuery(param.id));
  }
}

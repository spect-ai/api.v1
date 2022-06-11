import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { Circle } from './dto/circle.dto';
import { ApiTags } from '@nestjs/swagger';
import { CreateCircleDto } from './dto/create-circle.dto';

@Controller('circles')
@ApiTags('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  // @Get()
  // findAll(): Promise<Circle[]> {
  //   return 'This action returns all circles';
  // }

  // @Get('/:objectId')
  // findOneByEntityId(@Param('id') id): Promise<Circle> {
  //   return 'This action returns all circles';
  // }

  // @Get('/:entityId')
  // findOneByObjectId(@Param('entityId') entityId): Promise<Circle> {
  //   return 'This action returns all circles';
  // }

  @Post()
  async create(@Body() circle: CreateCircleDto): Promise<Circle> {
    console.log(circle);
    return await this.circlesService.create(circle);
  }
}

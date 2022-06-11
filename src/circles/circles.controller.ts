import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { CreateCircleResponseDto } from './dto/create-circle-response.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';

@Controller('circles')
@ApiTags('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  @Get('/allParents')
  async findAllParentCircles(): Promise<DetailedCircleResponseDto[]> {
    return await this.circlesService.getParentCircles();
  }

  @Get('/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Object Id of the circle',
    schema: { type: 'string' },
  })
  async findByObjectId(@Param('id') id): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.getDetailedCircle(id);
  }

  @Post('/create')
  @ApiBody({ type: CreateCircleRequestDto })
  async create(
    @Body() circle: CreateCircleRequestDto,
  ): Promise<CreateCircleResponseDto> {
    console.log(circle);
    return await this.circlesService.create(circle);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CirclesService } from './circles.service';
import { ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { LocalAuthGuard } from 'src/auth/local-auth.gaurd';

@Controller('circles')
@ApiTags('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  @Get('/allPublicParents')
  async findAllParentCircles(): Promise<DetailedCircleResponseDto[]> {
    return await this.circlesService.getPublicParentCircles();
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

  @Post('/')
  @ApiBody({ type: CreateCircleRequestDto })
  async create(
    @Body() circle: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.create(circle);
  }

  @Patch('/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Object Id of the circle',
    schema: { type: 'string' },
  })
  @ApiBody({ type: UpdateCircleRequestDto })
  async update(
    @Param('id') id,
    @Body() circle: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.update(id, circle);
  }

  @Post('/:id/delete')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Object Id of the circle',
    schema: { type: 'string' },
  })
  async delete(@Param('id') id): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.delete(id);
  }
}

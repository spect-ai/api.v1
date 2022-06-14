import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CirclesService } from './circles.service';
import { ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { LocalAuthGuard } from 'src/auth/local-auth.gaurd';
// import { RolesGuard } from 'src/auth/role-auth.guard';

@Controller('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  @Get('/allPublicParents')
  async findAllParentCircles(): Promise<DetailedCircleResponseDto[]> {
    return await this.circlesService.getPublicParentCircles();
  }

  @Get('/slug/:slug')
  async findBySlug(@Param('slug') slug): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.getDetailedCircleBySlug(slug);
  }

  @Get('/:id')
  async findByObjectId(@Param('id') id): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.getDetailedCircle(id);
  }

  @Post('/')
  async create(
    @Body() circle: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.create(circle);
  }

  @Patch('/:id')
  async update(
    @Param('id') id,
    @Body() circle: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.update(id, circle);
  }

  @Post('/:id/delete')
  async delete(@Param('id') id): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.delete(id);
  }
}

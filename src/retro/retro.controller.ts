import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateRetroRequestDto } from './dto/create-retro-request.dto';
import { DetailedRetroResponseDto } from './dto/detailed-retro-response.dto';
import { UpdateRetroRequestDto } from './dto/update-retro-request.dto';
import { RetroService } from './retro.service';

@Controller('retro')
export class RetroController {
  constructor(private readonly retroService: RetroService) {}

  @Get('/slug/:slug')
  async findBySlug(@Param('slug') slug): Promise<DetailedRetroResponseDto> {
    return await this.retroService.getDetailedRetroBySlug(slug);
  }

  @Get('/:id')
  async findByObjectId(@Param('id') id): Promise<DetailedRetroResponseDto> {
    return await this.retroService.getDetailedRetro(id);
  }

  @Post('/')
  async create(
    @Body() retro: CreateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.create(retro);
  }

  @Patch('/:id')
  async update(
    @Param('id') id,
    @Body() circle: UpdateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.update(id, circle);
  }

  @Post('/:id/delete')
  async delete(@Param('id') id): Promise<DetailedRetroResponseDto> {
    return await this.retroService.delete(id);
  }
}

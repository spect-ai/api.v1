import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';

@Controller('card')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('/byProjectAndSlug/:project/:slug')
  async findBySlug(
    @Param('project') project,
    @Param('slug') slug,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCardBySlug(project, slug);
  }

  @Get('/:id')
  async findByObjectId(@Param('id') id): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCard(id);
  }

  @Post('/')
  async create(
    @Body() card: CreateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.create(card);
  }

  @Patch('/:id')
  async update(
    @Param('id') id,
    @Body() circle: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.update(id, circle);
  }

  @Post('/:id/delete')
  async delete(@Param('id') id): Promise<DetailedCardResponseDto> {
    return await this.cardsService.delete(id);
  }
}

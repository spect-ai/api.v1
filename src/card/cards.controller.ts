import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
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
  @UseGuards(SessionAuthGuard)
  async create(@Body() card: CreateCardRequestDto) {
    // temp fix to convert map to object
    let proj: any = await this.cardsService.create(card);
    proj = {
      ...proj,
      cards: Object.fromEntries(proj.cards),
    };
    return proj;
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

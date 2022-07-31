import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CreateNewCardAuthGuard } from 'src/auth/card.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { CardsV1Service } from './cards-v1.service';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { GetCardByIdQuery } from './queries/impl';

@Controller('card/v1')
@ApiTags('cardv1')
export class CardsV1Controller {
  constructor(
    private readonly cardsService: CardsV1Service,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/:id')
  async findByObjectId(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.queryBus.execute(new GetCardByIdQuery(params.id));
  }

  @Post('/')
  @UseGuards(CreateNewCardAuthGuard)
  async create(@Body() card: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
  }> {
    return await this.cardsService.create(card);
  }
}

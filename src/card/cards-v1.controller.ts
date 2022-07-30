import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { CardsService } from './cards.service';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { GetCardByIdQuery } from './queries/impl';

@Controller('card/v1')
@ApiTags('cardv1')
export class CardsV1Controller {
  constructor(
    private readonly cardsService: CardsService,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/:id')
  async findByObjectId(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.queryBus.execute(new GetCardByIdQuery(params.id));
  }
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { PopulatedCardFields } from '../../types/types';
import {
  GetCardByIdQuery,
  GetMultipleCardsByIdsQuery,
  GetCardBySlugQuery,
} from '../impl';

@QueryHandler(GetCardByIdQuery)
export class GetCardByIdQueryHandler
  implements IQueryHandler<GetCardByIdQuery>
{
  constructor(private readonly cardRepository: CardsRepository) {}

  async execute(query: GetCardByIdQuery): Promise<DetailedCardResponseDto> {
    const card = await this.cardRepository.getCardById(
      query.id,
      query.customPopulate,
      query.selectedFields,
    );
    return card;
  }
}

@QueryHandler(GetMultipleCardsByIdsQuery)
export class GetMultipleCardsByIdsQueryHandler
  implements IQueryHandler<GetMultipleCardsByIdsQuery>
{
  constructor(private readonly cardRepository: CardsRepository) {}

  async execute(
    query: GetMultipleCardsByIdsQuery,
  ): Promise<DetailedCardResponseDto[]> {
    const card = await this.cardRepository.getMultipleCardsByIds(
      query.ids,
      query.customPopulate,
      query.selectedFields,
    );
    return card;
  }
}

@QueryHandler(GetCardBySlugQuery)
export class GetCardBySlugQueryHandler
  implements IQueryHandler<GetCardBySlugQuery>
{
  constructor(private readonly cardRepository: CardsRepository) {}

  async execute(query: GetCardBySlugQuery): Promise<DetailedCardResponseDto> {
    const card = await this.cardRepository.getCardBySlug(
      query.slug,
      query.customPopulate,
      query.selectedFields,
    );
    return card;
  }
}

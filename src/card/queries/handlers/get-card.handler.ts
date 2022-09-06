import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { ExtendedCard } from 'src/card/model/card.model';
import {
  GetCardByFilterQuery,
  GetCardByIdQuery,
  GetCardBySlugQuery,
  GetCardWithChildrenQuery,
  GetMultipleCardsByIdsQuery,
  GetMultipleCardsWithChildrenByFilterQuery,
  GetMultipleCardsWithChildrenQuery,
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

@QueryHandler(GetCardByFilterQuery)
export class GetCardByFilterQueryHandler
  implements IQueryHandler<GetCardByFilterQuery>
{
  constructor(private readonly cardRepository: CardsRepository) {}

  async execute(query: GetCardByFilterQuery): Promise<DetailedCardResponseDto> {
    const card = await this.cardRepository.getCardByFilter(
      query.filterQuery,
      query.customPopulate,
      query.selectedFields,
    );
    return card;
  }
}

@QueryHandler(GetMultipleCardsWithChildrenQuery)
export class GetMultipleCardsWithChildrenQueryHandler
  implements IQueryHandler<GetMultipleCardsWithChildrenQuery>
{
  constructor(private readonly cardRepository: CardsRepository) {}

  async execute(
    query: GetMultipleCardsWithChildrenQuery,
  ): Promise<ExtendedCard[]> {
    console.log('GetMultipleCardsWithChildrenQueryHandler');
    const cards =
      await this.cardRepository.getCardWithAllChildrenForMultipleCards(
        query.ids,
      );
    return cards;
  }
}

@QueryHandler(GetMultipleCardsWithChildrenByFilterQuery)
export class GetMultipleCardsWithChildrenByFilterQueryHandler
  implements IQueryHandler<GetMultipleCardsWithChildrenByFilterQuery>
{
  constructor(private readonly cardRepository: CardsRepository) {}

  async execute(
    query: GetMultipleCardsWithChildrenByFilterQuery,
  ): Promise<ExtendedCard[]> {
    console.log('GetMultipleCardsWithChildrenByFilterQueryHandler');
    console.log(query.filterQuery);
    const cards =
      await this.cardRepository.getCardWithAllChildrenByFilterForMultipleCards(
        query.filterQuery,
      );
    return cards;
  }
}

@QueryHandler(GetCardWithChildrenQuery)
export class GetCardWithChildrenQueryHandler
  implements IQueryHandler<GetCardWithChildrenQuery>
{
  constructor(private readonly cardRepository: CardsRepository) {}

  async execute(query: GetCardWithChildrenQuery): Promise<ExtendedCard> {
    const card = await this.cardRepository.getCardWithAllChildren(query.id);

    /** Aggregate query doesnt add id so adding manually */
    for (const child of card.flattenedChildren) {
      child.id = child._id.toString();
    }

    return card;
  }
}

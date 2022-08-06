import { PopulatedCardFields } from 'src/card/types/types';

export class GetCardByIdQuery {
  constructor(
    public readonly id: string,
    public readonly customPopulate?: PopulatedCardFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetMultipleCardsByIdsQuery {
  constructor(
    public readonly ids: string[],
    public readonly customPopulate?: PopulatedCardFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetCardBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly customPopulate?: PopulatedCardFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetMultipleCardsWithChildrenQuery {
  constructor(public readonly ids: string[]) {}
}
export class GetCardWithChildrenQuery {
  constructor(public readonly id: string) {}
}

import { PopulatedCircleFields } from 'src/circle/types';

export class GetCircleByIdQuery {
  constructor(
    public readonly id: string,
    public readonly customPopulate?: PopulatedCircleFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetCircleBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly customPopulate?: PopulatedCircleFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

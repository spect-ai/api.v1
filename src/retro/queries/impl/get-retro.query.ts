import { PopulatedRetroFields } from 'src/retro/types';

export class GetRetroByIdQuery {
  constructor(
    public readonly id: string,
    public readonly customPopulate?: PopulatedRetroFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetRetroBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly customPopulate?: PopulatedRetroFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

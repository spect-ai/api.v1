import { PopulatedProjectFields } from 'src/project/types/types';

export class GetProjectByIdQuery {
  constructor(
    public readonly id: string,
    public readonly customPopulate?: PopulatedProjectFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetProjectBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly customPopulate?: PopulatedProjectFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

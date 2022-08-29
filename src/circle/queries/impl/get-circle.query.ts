import { FilterQuery } from 'mongoose';
import { Circle } from 'src/circle/model/circle.model';
import { PopulatedCircleFields } from 'src/circle/types';

export class GetCircleByIdQuery {
  constructor(
    public readonly id: string,
    public readonly customPopulate?: PopulatedCircleFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly ignorePrivateCircles = true,
  ) {}
}

export class GetMultipleCirclesQuery {
  constructor(
    public readonly filterQuery: FilterQuery<Circle>,
    public readonly customPopulate?: PopulatedCircleFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly ignorePrivateCircles = true,
  ) {}
}

export class GetCircleBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly customPopulate?: PopulatedCircleFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly ignorePrivateCircles = true,
  ) {}
}

export class GetCircleByFilterQuery {
  constructor(
    public readonly filterQuery: FilterQuery<Circle>,
    public readonly customPopulate?: PopulatedCircleFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly ignorePrivateCircles = true,
  ) {}
}

export class GetCircleWithChildrenQuery {
  constructor(public readonly id: string, public readonly maxDepth?: number) {}
}

export class GetCircleWithAllRelationsQuery {
  constructor(
    public readonly id: string,
    public readonly maxChildrenDepth?: number,
    public readonly maxParentsDepth?: number,
  ) {}
}

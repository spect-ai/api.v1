import { FilterQuery } from 'mongoose';
import { Collection } from 'src/collection/model/collection.model';
import { PopulatedCollectionFields } from 'src/collection/types/types';

export class GetCollectionByIdQuery {
  constructor(
    public readonly id: string,
    public readonly customPopulate?: PopulatedCollectionFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly ignorePrivateCollections = true,
  ) {}
}

export class GetMultipleCollectionsQuery {
  constructor(
    public readonly filterQuery: FilterQuery<Collection>,
    public readonly customPopulate?: PopulatedCollectionFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly ignorePrivateCollections = true,
  ) {}
}

export class GetCollectionBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly customPopulate?: PopulatedCollectionFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly ignorePrivateCollections = true,
  ) {}
}

export class GetCollectionByFilterQuery {
  constructor(
    public readonly filterQuery: FilterQuery<Collection>,
    public readonly customPopulate?: PopulatedCollectionFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly ignorePrivateCollections = true,
  ) {}
}

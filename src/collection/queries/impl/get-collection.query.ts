import { FilterQuery } from 'mongoose';
import { Collection } from 'src/collection/model/collection.model';
import { PopulatedCollectionFields } from 'src/collection/types/types';
import { User } from 'src/users/model/users.model';

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
  ) {}
}

export class GetCollectionBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly customPopulate?: PopulatedCollectionFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetCollectionByFilterQuery {
  constructor(
    public readonly filterQuery: FilterQuery<Collection>,
    public readonly customPopulate?: PopulatedCollectionFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetPublicViewCollectionQuery {
  constructor(
    public readonly caller?: User,
    public readonly slug?: string,
    public readonly collection?: Collection,
  ) {}
}

export class GetPrivateViewCollectionQuery {
  constructor(
    public readonly slug?: string,
    public readonly collection?: Collection,
  ) {}
}

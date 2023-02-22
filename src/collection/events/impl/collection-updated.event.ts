import { Collection } from 'src/collection/model/collection.model';

export class CollectionUpdatedEvent {
  constructor(
    public readonly collection: Collection,
    public readonly update: Partial<Collection>,
    public readonly caller: string,
  ) {}
}

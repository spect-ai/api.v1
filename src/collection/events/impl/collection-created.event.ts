import { Collection } from 'src/collection/model/collection.model';

export class CollectionCreatedEvent {
  constructor(
    public readonly collection: Collection,
    public readonly caller: string,
  ) {}
}

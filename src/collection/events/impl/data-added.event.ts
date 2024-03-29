import { Collection } from 'src/collection/model/collection.model';
import { User } from 'src/users/model/users.model';

export class DataAddedEvent {
  constructor(
    public readonly collection: Collection,
    public readonly data: object,
    public readonly caller?: User,
  ) {}
}

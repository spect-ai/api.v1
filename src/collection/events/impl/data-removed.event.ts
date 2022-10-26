import { Collection } from 'src/collection/model/collection.model';
import { User } from 'src/users/model/users.model';

export class DataRemovedEvent {
  constructor(
    public readonly collection: Collection,
    public readonly data: any,
    public readonly caller?: User,
  ) {}
}

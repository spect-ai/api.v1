import { Collection } from 'src/collection/model/collection.model';
import { User } from 'src/users/model/users.model';

export class DataUpatedEvent {
  constructor(
    public readonly collection: Collection,
    public readonly update: object,
    public readonly existingData: object,
    public readonly caller?: User,
  ) {}
}

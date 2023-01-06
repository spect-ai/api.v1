import { Collection } from 'src/collection/model/collection.model';
import { User } from 'src/users/model/users.model';

export class VotingEndedEvent {
  constructor(
    public readonly collection: Collection,
    public readonly dataSlug: string,
    public readonly caller?: User,
  ) {}
}

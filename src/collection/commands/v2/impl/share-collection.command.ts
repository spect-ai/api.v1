import { User } from 'src/users/model/users.model';

export class ShareCollectionCommand {
  constructor(
    public readonly collectionSlug: string,
    public readonly caller: User,
  ) {}
}

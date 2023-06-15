import { User } from 'src/users/model/users.model';

export class MoveCollectionCommand {
  constructor(
    public readonly collectionSlug: string,
    public readonly circleId: string,
    public readonly caller: User,
    public readonly folderId?: string,
  ) {}
}

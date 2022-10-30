import { User } from 'src/users/model/users.model';

export class UpdateDataCommand {
  constructor(
    public readonly data: object,
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly dataSlug: string,
    public readonly view: 'public' | 'private',
  ) {}
}

import { User } from 'src/users/model/users.model';

export class ModifyDataStatusCommand {
  constructor(
    public readonly caller: User,
    public readonly dataSlug: string,
    public readonly active: boolean,
    public readonly collectionId: string,
  ) {}
}

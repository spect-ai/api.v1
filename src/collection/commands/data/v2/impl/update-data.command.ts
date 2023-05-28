import { User } from 'src/users/model/users.model';

export class UpdateProjectDataCommand {
  constructor(
    public readonly data: object,
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly dataSlug: string,
  ) {}
}

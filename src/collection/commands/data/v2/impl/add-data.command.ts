import { User } from 'src/users/model/users.model';

export class AddProjectDataCommand {
  constructor(
    public readonly data: object,
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly validateData = true,
  ) {}
}

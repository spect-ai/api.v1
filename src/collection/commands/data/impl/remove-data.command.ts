import { User } from 'src/users/model/users.model';

export class RemoveDataCommand {
  constructor(
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly dataSlug: string,
  ) {}
}

export class RemoveMultipleDataCommand {
  constructor(
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly dataIds: string[],
  ) {}
}

import { User } from 'src/users/model/users.model';

export class DuplicateFormCommand {
  constructor(
    public readonly collectionSlug: string,
    public readonly caller: User,
  ) {}
}

export class DuplicateProjectCommand {
  constructor(
    public readonly collectionSlug: string,
    public readonly caller: User,
  ) {}
}

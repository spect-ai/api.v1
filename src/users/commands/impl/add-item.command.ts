import { User } from 'src/users/model/users.model';
import { ArrayField, UserSubmittedApplication } from 'src/users/types/types';

export class AddItemCommand {
  constructor(
    public readonly caller: string,
    public readonly field: ArrayField,
    public readonly item: string | UserSubmittedApplication,
    public readonly user?: User,
    public readonly userId?: string,
  ) {}
}

export class AddMultipleItemsForMultipleUsersCommand {
  constructor(
    public readonly caller: string,
    public readonly field: ArrayField[],
    public readonly item: string | UserSubmittedApplication,
    public readonly user?: User,
    public readonly userId?: string,
  ) {}
}

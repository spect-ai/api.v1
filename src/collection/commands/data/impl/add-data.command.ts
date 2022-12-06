import { User } from 'src/users/model/users.model';

export class AddDataCommand {
  constructor(
    public readonly data: object,
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly onlyIfForm?: boolean,
  ) {}
}

export class AddDataUsingAutomationCommand {
  constructor(
    public readonly data: object,
    public readonly collectionId: string,
  ) {}
}

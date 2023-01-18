import { User } from 'src/users/model/users.model';

export class AddDataCommand {
  constructor(
    public readonly data: object,
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly anon: boolean,
    public readonly onlyIfForm?: boolean,
  ) {}
}

export class AddDataUsingAutomationCommand {
  constructor(
    public readonly data: object,
    public readonly collectionId: string,
  ) {}
}
export class AddMultipleDataUsingAutomationCommand {
  constructor(
    public readonly data: any[],
    public readonly collectionId: string,
  ) {}
}

import { User } from 'src/users/model/users.model';

export class ConnectGithubCommand {
  constructor(public readonly user: User, public readonly code: string) {}
}

export class DisconnectGithubCommand {
  constructor(public readonly user: User) {}
}

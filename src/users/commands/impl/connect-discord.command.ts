import { User } from 'src/users/model/users.model';

export class ConnectDiscordCommand {
  constructor(public readonly user: User, public readonly code: string) {}
}
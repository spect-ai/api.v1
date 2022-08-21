import { User } from 'src/users/model/users.model';

export class ReadNotificationCommand {
  constructor(
    public readonly notificationIds: string[],
    public readonly user: User,
  ) {}
}

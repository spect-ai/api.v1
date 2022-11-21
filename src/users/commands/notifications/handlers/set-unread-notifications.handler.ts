import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, IQueryHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { SetUnreadNotificationsCommand } from '../impl/set-unread-notifications.command';

@CommandHandler(SetUnreadNotificationsCommand)
export class SetUnreadNotificationsCommandHandler
  implements IQueryHandler<SetUnreadNotificationsCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly userRepository: UsersRepository,
  ) {
    this.logger.setContext('SetUnreadNotifs');
  }

  async execute(command: SetUnreadNotificationsCommand): Promise<boolean> {
    try {
      const { caller } = command;
      console.log({ caller });
      if (!caller) {
        throw `User with id ${caller.id} not found`;
      }
      // mark all user notifs as read
      caller.notificationsV2.forEach((n) => (n.read = true));
      await this.userRepository.updateById(caller.id, {
        notificationsV2: [...(caller.notificationsV2 || [])],
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed getting user unread  notifications with error: ${error}`,
      );
      throw new InternalServerErrorException(
        `Failed setting user unread notifcations`,
        error,
      );
    }
  }
}

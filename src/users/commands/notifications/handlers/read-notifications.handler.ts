import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { LoggingService } from 'src/logging/logging.service';
import { ReadNotificationCommand } from '../impl';

@CommandHandler(ReadNotificationCommand)
export class ReadNotificationCommandHandler
  implements ICommandHandler<ReadNotificationCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ReadNotificationCommandHandler');
  }

  async execute(command: ReadNotificationCommand): Promise<User> {
    try {
      console.log('ReadNotificationCommandHandler');
      const { notificationIds, user } = command;

      user.notifications = user.notifications.map((n) => {
        if (notificationIds.includes(n.id)) {
          n.read = true;
        }
        return n;
      });

      const updatedUser = await this.userRepository.updateById(user.id, {
        notifications: user.notifications,
      });

      return user;
    } catch (error) {
      this.logger.error(
        `Failed updating notification with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed updating notification',
        error.message,
      );
    }
  }
}

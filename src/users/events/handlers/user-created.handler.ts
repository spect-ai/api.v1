import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { UserCreatedEvent } from '../impl';

@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler
  implements IEventHandler<UserCreatedEvent>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UserCreatedEventHandler');
  }

  async handle(command: UserCreatedEvent) {
    try {
      this.logger.log('Created User');
    } catch (error) {
      this.logger.error(
        `Failed adding item to user with error: ${error.message}`,
        command,
      );
    }
  }
}

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { UserCreatedEvent } from '../impl';
import { GuildxyzService } from 'src/common/guildxyz.service';

@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler
  implements IEventHandler<UserCreatedEvent>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
    private readonly guildxyzService: GuildxyzService,
  ) {
    this.logger.setContext('UserCreatedEventHandler');
  }

  async handle(command: UserCreatedEvent) {
    try {
      this.logger.log('Created User');
      const { user } = command;

      let guilds;
      if (user?.ethAddress)
        guilds =
          await this.guildxyzService.getDetailedGuildMembershipsWithRoles(
            user?.ethAddress,
          );
      if (guilds)
        await this.userRepository.updateById(user.id, { guilds: guilds });
    } catch (error) {
      this.logger.error(
        `Failed adding item to user with error: ${error.message}`,
        command,
      );
    }
  }
}

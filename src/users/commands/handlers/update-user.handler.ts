import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { AddItemsCommand, UpdateUserCommand } from '../impl';
import { LoggingService } from 'src/logging/logging.service';

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler
  implements ICommandHandler<UpdateUserCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddItemCommandHandler');
  }

  async execute(command: UpdateUserCommand): Promise<User> {
    try {
      console.log('AddItemCommandHandler');
      const { updateUserDto, user, userId } = command;
      let userToUpdate = user;
      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(userId);
      if (!userToUpdate) throw new Error('User not found');

      if (updateUserDto.username && user.username !== updateUserDto.username) {
        const usernameTaken = await this.userRepository.exists({
          username: updateUserDto.username,
        });
        if (usernameTaken) throw 'Username taken';
      }
      return await this.userRepository.updateById(user.id, updateUserDto);
    } catch (error) {
      this.logger.error(
        `Failed adding item to user with error: ${error}`,
        command,
      );
    }
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { AddItemCommand } from '../impl';
import { LoggingService } from 'src/logging/logging.service';

@CommandHandler(AddItemCommand)
export class AddItemCommandHandler implements ICommandHandler<AddItemCommand> {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddItemCommandHandler');
  }

  async execute(command: AddItemCommand): Promise<User> {
    try {
      console.log('AddItemCommandHandler');
      const { caller, field, item, user, userId } = command;
      let userToUpdate = user;
      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(userId);

      // Item already exists
      if (userToUpdate[field] && userToUpdate[field].includes(item)) return;

      const updatedUser = await this.userRepository.updateById(
        userToUpdate.id,
        {
          [field]: [...(userToUpdate[field] || []), item],
        },
      );
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Failed adding item to user with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed adding item update',
        error.message,
      );
    }
  }
}

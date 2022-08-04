import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { AddItemsCommand } from '../impl';
import { LoggingService } from 'src/logging/logging.service';

@CommandHandler(AddItemsCommand)
export class AddItemCommandHandler implements ICommandHandler<AddItemsCommand> {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddItemCommandHandler');
  }

  async execute(command: AddItemsCommand): Promise<User> {
    try {
      console.log('AddItemCommandHandler');
      const { items, user, userId } = command;
      let userToUpdate = user;
      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(userId);
      if (!userToUpdate) throw new Error('User not found');

      const updateObj = {};
      for (const item of items) {
        if (!userToUpdate[item.fieldName]) userToUpdate[item.fieldName] = [];
        for (const itemId of item.itemIds) {
          if (!userToUpdate[item.fieldName].includes(itemId))
            updateObj[item.fieldName] = [
              ...(userToUpdate[item.fieldName] || []),
              itemId,
            ];
        }
      }

      const updatedUser = await this.userRepository.updateById(
        userToUpdate.id,
        updateObj,
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

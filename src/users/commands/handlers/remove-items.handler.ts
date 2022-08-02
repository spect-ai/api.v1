import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { RemoveItemsCommand } from '../impl/remove-items.command';

@CommandHandler(RemoveItemsCommand)
export class RemoveItemsCommandHandler
  implements ICommandHandler<RemoveItemsCommand>
{
  constructor(private readonly userRepository: UsersRepository) {}

  async execute(command: RemoveItemsCommand): Promise<User> {
    try {
      const { user, id, items } = command;
      let userToUpdate = user;
      if (!userToUpdate) {
        userToUpdate = await this.userRepository.findById(id);
      }
      if (!userToUpdate) {
        throw new InternalServerErrorException('Project not found');
      }

      const updateObj = {};
      for (const item of items) {
        updateObj[item.fieldName] = userToUpdate[item.fieldName].filter(
          (itemId) => !item.itemIds.includes(itemId),
        );
      }
      const updatedUser = await this.userRepository.updateById(
        userToUpdate.id,
        updateObj,
      );
      return updatedUser;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

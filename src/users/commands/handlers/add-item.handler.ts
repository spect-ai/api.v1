import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { AddItemCommand } from '../impl';

@CommandHandler(AddItemCommand)
export class AddItemCommandHandler implements ICommandHandler<AddItemCommand> {
  constructor(private readonly userRepository: UsersRepository) {}

  async execute(command: AddItemCommand): Promise<User> {
    try {
      console.log('AddItemCommandHandler');
      const { caller, field, item, user, userId } = command;
      let userToUpdate = user;
      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(userId);
      if (userToUpdate[field] && userToUpdate[field].includes(item))
        throw new Error('Item already added');
      const updatedUser = await this.userRepository.updateById(user.id, {
        [field]: [...(userToUpdate[field] || []), item],
      });
      return updatedUser;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed adding item update',
        error.message,
      );
    }
  }
}

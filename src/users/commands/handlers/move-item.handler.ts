import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { AddItemCommand, MoveItemCommand } from '../impl';

@CommandHandler(MoveItemCommand)
export class MoveItemCommandHandler
  implements ICommandHandler<MoveItemCommand>
{
  constructor(private readonly userRepository: UsersRepository) {}

  async execute(command: MoveItemCommand): Promise<User> {
    try {
      console.log('MoveItemCommandHandler');
      const { caller, fieldFrom, fieldTo, item, user, userId } = command;
      let userToUpdate = user;
      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(userId);
      if (!userToUpdate[fieldFrom]) throw new Error('Field doesnt exist');
      const index = this.findItemIndex(fieldFrom, item, userToUpdate);
      if (index === -1) throw new Error('Item doesnt exist');

      const updatedUser = await this.userRepository.updateById(
        userToUpdate.id,
        {
          [fieldTo]: [
            ...(userToUpdate[fieldTo] || []),
            userToUpdate[fieldFrom][index],
          ],
          [fieldFrom]: userToUpdate[fieldFrom].filter((_, i) => i !== index),
        },
      );
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed adding item update',
        error.message,
      );
    }
  }

  findItemIndex(itemType: string, item: string, user: User): number {
    if (
      [
        'activeApplications',
        'pickedApplications',
        'rejectedApplications',
      ].includes(itemType)
    ) {
      console.log('findItemIndex', itemType, item, user[itemType]);
      for (const [idx, application] of user[itemType].entries()) {
        if (application.cardId === item) return idx;
      }
      return -1;
    } else return user[itemType].indexOf(item);
  }
}
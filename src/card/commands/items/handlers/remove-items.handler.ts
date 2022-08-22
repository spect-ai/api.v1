import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { Card } from 'src/card/model/card.model';
import { RemoveItemsCommand } from '../impl/remove-items.command';

@CommandHandler(RemoveItemsCommand)
export class RemoveItemsCommandHandler
  implements ICommandHandler<RemoveItemsCommand>
{
  constructor(private readonly cardRepository: CardsRepository) {}

  async execute(command: RemoveItemsCommand): Promise<Card> {
    try {
      const { card, id, items } = command;
      let cardToUpdate = card;
      if (!cardToUpdate) {
        cardToUpdate = await this.cardRepository.findById(id);
      }
      if (!cardToUpdate) {
        throw new InternalServerErrorException('User not found');
      }

      const updateObj = {};
      for (const item of items) {
        updateObj[item.fieldName] = cardToUpdate[item.fieldName].filter(
          (itemId) => !item.itemIds.includes(itemId),
        );
      }
      const updatedCard = await this.cardRepository.updateById(
        cardToUpdate.id,
        updateObj,
      );
      return updatedCard;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

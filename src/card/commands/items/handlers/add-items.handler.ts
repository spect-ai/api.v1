import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CardsRepository } from 'src/card/cards.repository';
import { AddItemsCommand } from '../impl/add-items.command';
import { Card } from 'src/card/model/card.model';

@CommandHandler(AddItemsCommand)
export class AddItemCommandHandler implements ICommandHandler<AddItemsCommand> {
  constructor(
    private readonly cardRepository: CardsRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddItemCommandHandler');
  }

  async execute(command: AddItemsCommand): Promise<Card> {
    try {
      console.log('AddItemCommandHandler');
      const { items, card, id } = command;
      let cardToUpdate = card;
      if (!cardToUpdate) cardToUpdate = await this.cardRepository.findById(id);
      if (!cardToUpdate) throw new Error('Card not found');

      const updateObj = {};
      for (const item of items) {
        if (!cardToUpdate[item.fieldName])
          throw new Error('Field doesnt exist');
        for (const itemId of item.itemIds) {
          if (!cardToUpdate[item.fieldName].includes(itemId))
            updateObj[item.fieldName] = [
              ...(cardToUpdate[item.fieldName] || []),
              itemId,
            ];
        }
      }

      const updatedCard = await this.cardRepository.updateById(
        cardToUpdate.id,
        updateObj,
      );
      return updatedCard;
    } catch (error) {
      this.logger.error(
        `Failed adding item to card with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed adding item update',
        error.message,
      );
    }
  }
}

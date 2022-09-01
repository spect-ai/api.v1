import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CardsRepository } from 'src/card/cards.repository';
import { Card } from 'src/card/model/card.model';
import { AddKudosCommand } from '../impl';

@CommandHandler(AddKudosCommand)
export class AddKudosCommandHandler
  implements ICommandHandler<AddKudosCommand>
{
  constructor(
    private readonly cardRepository: CardsRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddKudosCommandHandler');
  }

  async execute(command: AddKudosCommand): Promise<Card> {
    try {
      console.log('AddKudosCommandHandler');
      const { kudos, card, id } = command;
      let cardToUpdate = card;
      if (!cardToUpdate) cardToUpdate = await this.cardRepository.findById(id);
      if (!cardToUpdate) throw new Error('Card not found');

      if (!cardToUpdate.kudosMinted) {
        cardToUpdate.kudosMinted = {
          [kudos.for]: kudos.tokenId,
        };
      } else {
        cardToUpdate.kudosMinted = {
          ...cardToUpdate.kudosMinted,
          [kudos.for]: kudos.tokenId,
        };
      }

      const updatedCard = await this.cardRepository.updateById(
        cardToUpdate.id,
        {
          kudosMinted: cardToUpdate.kudosMinted,
        },
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

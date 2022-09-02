import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { Card } from 'src/card/model/card.model';
import { LoggingService } from 'src/logging/logging.service';
import { RecordClaimCommand } from '../impl/record-claim.command';

@CommandHandler(RecordClaimCommand)
export class RecordClaimCommandHandler
  implements ICommandHandler<RecordClaimCommand>
{
  constructor(
    private readonly cardRepository: CardsRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RecordClaimCommandHandler');
  }

  async execute(command: RecordClaimCommand): Promise<Card> {
    try {
      console.log('RecordClaimCommandHandler');
      const { recordClaimRequestDto, caller, card, id } = command;
      let cardToUpdate = card;
      if (!cardToUpdate) cardToUpdate = await this.cardRepository.findById(id);
      if (!cardToUpdate) throw new Error('Card not found');

      const update = {};
      if (!cardToUpdate.kudosClaimedBy) {
        update['kudosClaimedBy'] = {
          [recordClaimRequestDto.tokenId]: [caller],
        };
      } else {
        update['kudosClaimedBy'] = {
          ...cardToUpdate.kudosClaimedBy,
          [recordClaimRequestDto.tokenId]: [
            ...(cardToUpdate.kudosClaimedBy[recordClaimRequestDto.tokenId] ||
              []),
            caller,
          ],
        };
      }

      console.log(update);
      const updatedCard =
        await this.cardRepository.updateCardAndReturnWithPopulatedReferences(
          cardToUpdate.id,
          update,
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

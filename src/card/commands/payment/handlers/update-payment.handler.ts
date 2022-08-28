import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { UpdatePaymentInfoDto } from 'src/card/dto/update-payment-info.dto';
import { Card } from 'src/card/model/card.model';
import { GetMultipleCardsWithChildrenQuery } from 'src/card/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateMultipleCardsCommand } from '../../impl/update-card.command';
import { UpdatePaymentCommand } from '../impl';

@CommandHandler(UpdatePaymentCommand)
export class UpdatePaymentCommandHandler
  implements ICommandHandler<UpdatePaymentCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdatePaymentCommandHandler');
  }

  async execute(command: UpdatePaymentCommand): Promise<boolean> {
    try {
      const { updatePaymentDto, caller } = command;
      if (!updatePaymentDto.cardIds || updatePaymentDto.cardIds.length === 0)
        throw `No card Ids provided while updating payment info`;
      const cards = await this.queryBus.execute(
        new GetMultipleCardsWithChildrenQuery(updatePaymentDto.cardIds),
      );
      const cardUpdates = {};
      let allChildren = [];
      for (const card of cards) {
        cardUpdates[card.id] = this.updatePaymentInfoAndStatus(
          card,
          updatePaymentDto,
        );
        allChildren = [...allChildren, ...card.flattenedChildren];
      }
      for (const child of allChildren) {
        if (!cardUpdates[child.id]) {
          cardUpdates[child.id] = this.updateToPaidStatus(child);
        }
      }

      return await this.commandBus.execute(
        new UpdateMultipleCardsCommand(caller, cardUpdates, null, null, cards),
      );
    } catch (error) {
      console.log(error);
      this.logger.error(
        `Failed updating payment info with error ${error.message}`,
      );
    }
  }

  updatePaymentInfoAndStatus(
    card: Card,
    updatePaymentInfoDto: UpdatePaymentInfoDto,
  ): Partial<Card> {
    return {
      reward: {
        ...card.reward,
        transactionHash: updatePaymentInfoDto.transactionHash,
      },
      status: {
        ...card.status,
        paid: true,
        active: false,
      },
    };
  }

  updateToPaidStatus(card: Card): Partial<Card> {
    return {
      status: {
        ...card.status,
        paid: true,
        active: false,
      },
    };
  }
}

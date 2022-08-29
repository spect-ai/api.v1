import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import {
  GetMultipleCardsWithChildrenByFilterQuery,
  GetMultipleCardsWithChildrenQuery,
} from 'src/card/queries/impl';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateMultipleCardsCommand } from '../../impl/update-card.command';
import { CloseCardsCommand } from '../impl';

@CommandHandler(CloseCardsCommand)
export class CloseCardsCommandHandler
  implements ICommandHandler<CloseCardsCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CloseCardCommandHandler');
  }

  async execute(command: CloseCardsCommand): Promise<boolean> {
    try {
      const { caller, cards, filter } = command;
      const cardsToUpdate =
        cards ||
        (await this.queryBus.execute(
          new GetMultipleCardsWithChildrenByFilterQuery(filter),
        ));
      const cardUpdates = {};
      const allChildren = [];
      for (const card of cardsToUpdate) {
        cardUpdates[card.id] = this.closeCard(card);
        for (const child of card.flattenedChildren) {
          cardUpdates[child.id] = this.closeCard(child);
          allChildren.push(child);
        }
      }
      console.log(cardUpdates);
      return await this.commandBus.execute(
        new UpdateMultipleCardsCommand(caller, cardUpdates, null, null, [
          ...cardsToUpdate,
          ...allChildren,
        ]),
      );
    } catch (error) {
      console.log(error);
      this.logger.error(`Failed closing card with error ${error.message}`);
    }
  }

  closeCard(card: Card): Partial<Card> {
    return {
      status: {
        ...card.status,
        active: false,
      },
    };
  }
}

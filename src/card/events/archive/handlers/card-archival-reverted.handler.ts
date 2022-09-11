import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { AddItemsCommand as AddItemsToUserCommand } from 'src/users/commands/impl';
import { CardArchivalRevertedEvent } from '../impl/card-archived.event';

@EventsHandler(CardArchivalRevertedEvent)
export class CardArchivalRevertedEventHandler
  implements IEventHandler<CardArchivalRevertedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CardArchivalRevertedEventHandler');
  }

  async handle(event: CardArchivalRevertedEvent) {
    try {
      console.log('CardArchivalRevertedEventHandler');
      const { cards } = event;
      for (const card of cards) {
        for (const assignee of card.properties['assignee'].value) {
          await this.commandBus.execute(
            new AddItemsToUserCommand(
              [
                {
                  fieldName: 'assignedCards',
                  itemIds: [card._id.toString()],
                },
              ],
              null,
              assignee,
            ),
          );
        }
        for (const reviewer of card.properties['reviewer'].value) {
          await this.commandBus.execute(
            new AddItemsToUserCommand(
              [
                {
                  fieldName: 'reviewingCards',
                  itemIds: [card._id.toString()],
                },
              ],
              null,
              reviewer,
            ),
          );
        }
      }
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

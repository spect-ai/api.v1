import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { RemoveItemsCommand as RemoveItemsFromUserCommand } from 'src/users/commands/impl';
import { CardsArchivedEvent } from '../impl/card-archived.event';

@EventsHandler(CardsArchivedEvent)
export class CardsArchivedEventHandler
  implements IEventHandler<CardsArchivedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CardsArchivedEventHandler');
  }

  async handle(event: CardsArchivedEvent) {
    try {
      console.log('CardsArchivedEventHandler');
      const { cards } = event;
      for (const card of cards) {
        for (const assignee of card.properties['assignee']) {
          await this.commandBus.execute(
            new RemoveItemsFromUserCommand(
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
        for (const reviewer of card.properties['reviewer']) {
          await this.commandBus.execute(
            new RemoveItemsFromUserCommand(
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

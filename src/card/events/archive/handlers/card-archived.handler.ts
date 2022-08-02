import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { RemoveItemsCommand } from 'src/users/commands/impl';
import { CardsArchivedEvent } from '../impl/card-archived.event';

@EventsHandler(CardsArchivedEvent)
export class CardsArchivedEventHandler
  implements IEventHandler<CardsArchivedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: CardsArchivedEvent) {
    console.log('CardsArchivedEventHandler');
    const { cards } = event;
    for (const card of cards) {
      for (const assignee of card.assignee) {
        await this.commandBus.execute(
          new RemoveItemsCommand([
            {
              fieldName: 'assignedCards',
              itemIds: [assignee],
            },
          ]),
        );
      }
      for (const assignee of card.reviewer) {
        await this.commandBus.execute(
          new RemoveItemsCommand([
            {
              fieldName: 'reviewingCards',
              itemIds: [assignee],
            },
          ]),
        );
      }
    }
  }
}

import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { AddItemsCommand } from 'src/users/commands/impl';
import { CardArchivalRevertedEvent } from '../impl/card-archived.event';

@EventsHandler(CardArchivalRevertedEvent)
export class CardArchivalRevertedEventHandler
  implements IEventHandler<CardArchivalRevertedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: CardArchivalRevertedEvent) {
    console.log('CardArchivalRevertedEventHandler');
    const { cards } = event;
    for (const card of cards) {
      for (const assignee of card.assignee) {
        await this.commandBus.execute(
          new AddItemsCommand([
            {
              fieldName: 'assignedCards',
              itemIds: [assignee],
            },
          ]),
        );
      }
      for (const assignee of card.reviewer) {
        await this.commandBus.execute(
          new AddItemsCommand([
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

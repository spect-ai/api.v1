import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
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
    const { cardIds } = event;
    console.log(cardIds);
  }
}

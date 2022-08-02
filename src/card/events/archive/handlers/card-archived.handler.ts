import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
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
    const { cardIds } = event;
    console.log(cardIds);
  }
}

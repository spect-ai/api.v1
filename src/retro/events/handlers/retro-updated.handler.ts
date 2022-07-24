import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RetroUpdatedEvent } from '../impl';

@EventsHandler(RetroUpdatedEvent)
export class RetroUpdatedEventHandler
  implements IEventHandler<RetroUpdatedEvent>
{
  async handle(event: RetroUpdatedEvent) {
    console.log('RetroUpdatedEventHandler');
  }
}

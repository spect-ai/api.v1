import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationEventV2 } from 'src/users/events/impl';
import { DataAddedEvent } from '../impl/data-added.event';
import { DataRemovedEvent } from '../impl/data-removed.event';
import { DataUpatedEvent } from '../impl/data-updated.event';
import { SendEventToSubscribersCommand } from 'src/collection/commands/subscription/impl/create-subscription.command';

@EventsHandler(DataRemovedEvent)
export class DataRemovedEventHandler
  implements IEventHandler<DataRemovedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('DataRemovedEventHandler');
  }

  async handle(event: DataRemovedEvent) {
    try {
      console.log('DataRemovedEventHandler');
      const { caller, collection } = event;
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

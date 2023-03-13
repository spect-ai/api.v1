import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionUpdatedEvent } from '../impl/collection-updated.event';
import { PoapService } from 'src/credentials/services/poap.service';

@EventsHandler(CollectionUpdatedEvent)
export class CollectionUpdatedEventHandler
  implements IEventHandler<CollectionUpdatedEvent>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly poapService: PoapService,
  ) {
    this.logger.setContext('CollectionUpdatedEventHandler');
  }

  async handle(event: CollectionUpdatedEvent) {
    try {
      console.log('CollectionUpdatedEvent');
      const { caller, collection, update } = event;

      this.logger.log(`Created Collection: ${collection.name}`);
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

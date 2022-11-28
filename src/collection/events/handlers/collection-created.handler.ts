import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionCreatedEvent } from '../impl/collection-created.event';
import { AddItemsCommand as AddItemsToUserCommand } from 'src/users/commands/impl';

@EventsHandler(CollectionCreatedEvent)
export class CollectionCreatedEventHandler
  implements IEventHandler<CollectionCreatedEvent>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CollectionCreatedEventHandler');
  }

  async handle(event: CollectionCreatedEvent) {
    try {
      console.log('CreatedCollectionEvent');
      const { caller, collection } = event;

      if (caller) {
        this.commandBus.execute(
          new AddItemsToUserCommand(
            [
              {
                fieldName: 'collections',
                itemIds: [collection.slug],
              },
            ],
            null,
            caller,
          ),
        );
      }
      this.logger.log(`Created Collection: ${collection.name}`);
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

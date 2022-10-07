import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationEventV2 } from 'src/users/events/impl';
import { DataAddedEvent } from '../impl/data-added.event';

@EventsHandler(DataAddedEvent)
export class DataAddedEventHandler implements IEventHandler<DataAddedEvent> {
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('DataAddedEventHandler');
  }

  async handle(event: DataAddedEvent) {
    try {
      console.log('DataAddedEventHandler');
      const { caller, collection } = event;

      let notifContent;
      if (collection.defaultView === 'form') {
        notifContent = `A new response was received on ${collection.name}`;
      } else if (collection.defaultView === 'table') {
        notifContent = `A new row was added on ${collection.name}`;
      } else {
        notifContent = `A new card was added on ${collection.name}`;
      }

      if (collection.notificationSettings?.userRecipientsOnNewData) {
        const recipients =
          collection.notificationSettings.userRecipientsOnNewData.filter(
            (a) => a !== caller.id,
          );
        this.eventBus.publish(
          new NotificationEventV2(notifContent, recipients),
        );
      }
      this.logger.log(
        `Created New Data in collection ${event.collection?.name}`,
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

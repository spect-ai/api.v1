import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import {
  NotificationEventV2,
  SingleNotificationEvent,
} from 'src/users/events/impl';
import { DataAddedEvent } from '../impl/data-added.event';
import { DataUpatedEvent } from '../impl/data-updated.event';

@EventsHandler(DataUpatedEvent)
export class DataUpatedEventHandler implements IEventHandler<DataUpatedEvent> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('DataUpatedEventHandler');
  }

  async handle(event: DataUpatedEvent) {
    try {
      console.log('DataUpatedEventHandler');
      const { caller, collection, update, existingData } = event;
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

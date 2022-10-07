import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationEventV2 } from 'src/users/events/impl';
import { DataAddedEvent } from '../impl/data-added.event';
import { DataUpatedEvent } from '../impl/data-updated.event';

@EventsHandler(DataUpatedEvent)
export class DataUpatedEventHandler implements IEventHandler<DataUpatedEvent> {
  constructor(
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

      const userToUpdatedNotificationProperties = {} as {
        [userId: string]: string[];
      };
      for (const [propertyId, data] of Object.entries(update)) {
        const propertyType = collection.properties[propertyId].type;
        const onUpdateNotifyUserTypes =
          collection.properties[propertyId].onUpdateNotifyUserTypes;
        const userType = collection.properties[propertyId].userType;
        if (onUpdateNotifyUserTypes) {
          if (
            propertyType === 'user' &&
            onUpdateNotifyUserTypes.includes(userType)
          ) {
            userToUpdatedNotificationProperties[data] = [
              ...(userToUpdatedNotificationProperties[data] || []),
              propertyId,
            ];
          }
          if (
            propertyType === 'user[]' &&
            onUpdateNotifyUserTypes.includes(userType)
          ) {
            for (const user of data) {
              userToUpdatedNotificationProperties[user] = [
                ...(userToUpdatedNotificationProperties[data] || []),
                propertyId,
              ];
            }
          }
        }
      }

      const term =
        collection.defaultView === 'form'
          ? 'response'
          : collection.defaultView === 'table'
          ? 'row'
          : 'card';
      for (const [userId, properties] of Object.entries(
        userToUpdatedNotificationProperties,
      )) {
        this.eventBus.publish(
          new NotificationEventV2(
            `Properties ${properties.join(',')} were updated in ${term} ${
              existingData['title']
            }`,
            [userId],
          ),
        );
      }
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

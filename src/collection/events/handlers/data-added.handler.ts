import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import {
  GetCollectionBySlugQuery,
  GetPrivateViewCollectionQuery,
} from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { SingleNotificationEvent } from 'src/users/events/impl';
import { DataAddedEvent } from '../impl/data-added.event';

@EventsHandler(DataAddedEvent)
export class DataAddedEventHandler implements IEventHandler<DataAddedEvent> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.logger.setContext('DataAddedEventHandler');
  }

  async handle(event: DataAddedEvent) {
    try {
      console.log('DataAddedEventHandler');
      const { caller, collection } = event;

      const notifContent = `A new response was received on ${collection.name}`;
      const subject = `New response on ${collection.name}`;
      const redirectUrl = `https://circles.spect.network/collection/${collection.slug}`;
      if (
        collection.circleRolesToNotifyUponNewResponse &&
        collection.circleRolesToNotifyUponNewResponse.length > 0
      ) {
        const circle = (await this.queryBus.execute(
          new GetCircleByIdQuery(collection.parents[0]),
        )) as Circle;
        const roleSet = new Set(collection.circleRolesToNotifyUponNewResponse);
        for (const [memberId, roles] of Object.entries(circle.memberRoles)) {
          const hasRole = roles.some((role) => roleSet.has(role));
          if (hasRole) {
            this.eventBus.publish(
              new SingleNotificationEvent(
                notifContent,
                memberId,
                subject,
                redirectUrl,
              ),
            );
          }
        }
      }

      const notifResponderContent = `Your response on ${collection.name} was received.`;
      const responderSubject = `Response received!`;
      const responderRedirectUrl = `https://circles.spect.network/`;
      this.eventBus.publish(
        new SingleNotificationEvent(
          notifResponderContent,
          caller?.id,
          responderSubject,
          responderRedirectUrl,
        ),
      );

      this.logger.log(
        `Created New Data in collection ${event.collection?.name}`,
      );
      const updatedCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug),
      );
      console.log('event', `${collection.slug}:dataAdded`);
      this.realtime.server.emit(
        `${collection.slug}:dataAdded`,
        updatedCollection,
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

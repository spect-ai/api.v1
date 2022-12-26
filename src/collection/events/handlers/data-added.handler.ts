import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { SingleNotificationEvent } from 'src/users/events/impl';
import { DataAddedEvent } from '../impl/data-added.event';
import { AddItemsCommand as AddItemsToUserCommand } from 'src/users/commands/impl';
import { PerformAutomationOnCollectionDataAddCommand } from 'src/automation/commands/impl';
import { UpdateMultipleCirclesCommand } from 'src/circle/commands/impl/update-circle.command';

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
      const { caller, collection, data } = event;
      const circle = (await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      )) as Circle;

      const notifContent = `A new response was received on ${collection.name}`;
      const redirectUrl = `/${circle.slug}/r/${collection.slug}?responses`;
      if (
        collection.circleRolesToNotifyUponNewResponse &&
        collection.circleRolesToNotifyUponNewResponse.length > 0
      ) {
        const roleSet = new Set(collection.circleRolesToNotifyUponNewResponse);
        // console.log({ roleSet });
        for (const [memberId, roles] of Object.entries(circle.memberRoles)) {
          const hasRole = roles.some((role) => roleSet.has(role));
          if (hasRole && !collection.creator) {
            this.eventBus.publish(
              new SingleNotificationEvent(
                notifContent,
                collection.formMetadata.logo || circle.avatar,
                redirectUrl,
                new Date(),
                [memberId],
              ),
            );
          }
        }
      }

      this.eventBus.publish(
        new SingleNotificationEvent(
          notifContent,
          collection.formMetadata.logo || circle.avatar,
          redirectUrl,
          new Date(),
          [collection.creator],
        ),
      );

      console.log({ data });
      const res = await this.commandBus.execute(
        new PerformAutomationOnCollectionDataAddCommand(
          collection,
          data,
          data['slug'],
          caller.id,
          circle,
        ),
      );
      console.log({ res });
      if (Object.keys(res.circle).length > 0) {
        await this.commandBus.execute(
          new UpdateMultipleCirclesCommand(res.circle),
        );
      }

      const notifResponderContent = `Your response on ${collection.name} was received.`;
      // const responderSubject = `Response received!`;
      const responderRedirectUrl = `/r/${collection.slug}`;
      this.eventBus.publish(
        new SingleNotificationEvent(
          notifResponderContent,
          collection.formMetadata.logo || circle.avatar,
          responderRedirectUrl,
          new Date(),
          [caller.id],
        ),
      );

      this.logger.log(
        `Created New Data in collection ${event.collection?.name}`,
      );
      const updatedCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug),
      );

      this.commandBus.execute(
        new AddItemsToUserCommand(
          [
            {
              fieldName: 'collectionsSubmittedTo',
              itemIds: [collection.slug],
            },
          ],
          null,
          caller.id,
        ),
      );

      // console.log('event', `${collection.slug}:dataAdded`);
      this.realtime.server.emit(
        `${collection.slug}:dataAdded`,
        updatedCollection,
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

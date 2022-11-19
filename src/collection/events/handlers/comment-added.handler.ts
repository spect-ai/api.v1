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
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { SingleNotificationEvent } from 'src/users/events/impl';
import { CommentAddedEvent } from '../impl/comment-added.event';
import { AddItemsCommand as AddItemsToUserCommand } from 'src/users/commands/impl';

@EventsHandler(CommentAddedEvent)
export class CommentAddedEventHandler
  implements IEventHandler<CommentAddedEvent>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
    private readonly eventBus: EventBus,
  ) {
    this.logger.setContext('DataUpatedEventHandler');
  }

  async handle(event: CommentAddedEvent) {
    try {
      console.log('DataAddedEventHandler');
      const { caller, collection, data } = event;
      const circle = (await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      )) as Circle;

      const notifContent = `A new comment was added on ${collection.name}'s response`;
      const redirectUrl = `/${circle.slug}/r/${collection.slug}?responses`;
      if (
        collection.circleRolesToNotifyUponNewResponse &&
        collection.circleRolesToNotifyUponNewResponse.length > 0
      ) {
        const roleSet = new Set(collection.circleRolesToNotifyUponNewResponse);
        console.log({ roleSet });
        for (const [memberId, roles] of Object.entries(circle.memberRoles)) {
          const hasRole = roles.some((role) => roleSet.has(role));
          if (hasRole && memberId !== caller.id) {
            this.eventBus.publish(
              new SingleNotificationEvent(
                notifContent,
                collection.logo || circle.avatar,
                redirectUrl,
                new Date(),
                [memberId],
              ),
            );
          }
        }
      }

      if (caller.id != collection.dataOwner[data.slug]) {
        const notifResponderContent = `Your response on ${collection.name} was received.`;
        // const responderSubject = `Response received!`;
        const responderRedirectUrl = `/r/${collection.slug}`;
        this.eventBus.publish(
          new SingleNotificationEvent(
            notifResponderContent,
            collection.logo || circle.avatar,
            responderRedirectUrl,
            new Date(),
            [collection.dataOwner[data.slug]],
          ),
        );
      }

      this.logger.log(
        `Created New Data in collection ${event.collection?.name}`,
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

      console.log('event', `${collection.slug}:dataAdded`);
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

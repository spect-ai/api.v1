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
    this.logger.setContext('CommentAddedEventHandler');
  }

  async handle(event: CommentAddedEvent) {
    try {
      console.log('CommentAddedEventHandler');
      const { caller, collection, data } = event;
      const circle = (await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      )) as Circle;

      const notifContent = `A new comment was added on ${collection.name}'s response by ${caller.username}`;
      const redirectUrl = `/${circle.slug}/r/${collection.slug}?dataId=${data.slug}`;
      if (
        collection.circleRolesToNotifyUponNewResponse &&
        collection.circleRolesToNotifyUponNewResponse.length > 0
      ) {
        const roleSet = new Set(collection.circleRolesToNotifyUponNewResponse);
        console.log({ roleSet });
        for (const [memberId, roles] of Object.entries(circle.memberRoles)) {
          const hasRole = roles.some((role) => roleSet.has(role));
          if (hasRole && memberId !== caller.id && !collection.creator) {
            this.eventBus.publish(
              new SingleNotificationEvent(
                notifContent,
                collection.formMetadata?.logo || circle.avatar,
                redirectUrl,
                new Date(),
                [memberId],
              ),
            );
          }
        }
      }

      if (collection.creator !== caller.id) {
        this.eventBus.publish(
          new SingleNotificationEvent(
            notifContent,
            collection.formMetadata?.logo || circle.avatar,
            redirectUrl,
            new Date(),
            [collection.creator],
          ),
        );
      }

      if (caller.id != collection.dataOwner[data.slug]) {
        const notifResponderContent = `A new comment was added on your response for ${collection.name} by ${caller.username}`;
        // const responderSubject = `Response received!`;
        const responderRedirectUrl = `/r/${collection.slug}`;
        this.eventBus.publish(
          new SingleNotificationEvent(
            notifResponderContent,
            collection.formMetadata?.logo || circle.avatar,
            responderRedirectUrl,
            new Date(),
            [collection.dataOwner[data.slug]],
          ),
        );
      }

      this.logger.log(
        `Created New comment in collection ${event.collection?.name} ${data.slug} by ${caller.username}`,
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

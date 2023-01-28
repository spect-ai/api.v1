import { EventBus, EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { SingleNotificationEvent } from 'src/users/events/impl';
import { VotingEndedEvent } from '../impl/voting-ended.event';

@EventsHandler(VotingEndedEvent)
export class VotingEndedEventHandler
  implements IEventHandler<VotingEndedEvent>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.logger.setContext('VotingEndedEventHandler');
  }

  async handle(event: VotingEndedEvent) {
    try {
      console.log('VotingEndedEventHandler');
      const { collection, dataSlug } = event;
      const circle = (await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      )) as Circle;

      const notifContent = `Voting period ended on ${collection.name}`;
      const redirectUrl = `/${circle.slug}/r/${collection.slug}?cardSlug=${dataSlug}`;

      const roleSet = new Set(collection.permissions.viewResponses);

      for (const [memberId, roles] of Object.entries(circle.memberRoles)) {
        const hasRole = roles.some((role) => roleSet.has(role));
        if (collection.creator !== memberId && hasRole) {
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

      this.logger.log(`Voting period ended on ${event.collection?.name}`);
      const updatedCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug),
      );

      // console.log('event', `${collection.slug}:dataAdded`);
      this.realtime.server.emit(
        `${collection.slug}:votingEnded on ${dataSlug}`,
        updatedCollection,
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

import { EventBus, EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { SingleNotificationEvent } from 'src/users/events/impl';
import { VotingStartedEvent } from '../impl/voting-started.event';

@EventsHandler(VotingStartedEvent)
export class VotingStartedEventHandler
  implements IEventHandler<VotingStartedEvent>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.logger.setContext('VotingStartedEventHandler');
  }

  async handle(event: VotingStartedEvent) {
    try {
      console.log('VotingStartedEventHandler');
      const { collection, snapshot, dataSlug } = event;
      const circle = (await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      )) as Circle;

      const notifContent = `${
        snapshot?.proposalId ? `Snapshot ` : ``
      }Voting period started on ${collection.name}`;
      const redirectUrl = `/${circle.slug}/r/${collection.slug}?cardSlug=${dataSlug}`;

      const roleSet = new Set(collection.permissions.viewResponses);

      for (const [memberId, roles] of Object.entries(circle.memberRoles)) {
        const hasRole = roles.some((role) => roleSet.has(role));
        if (collection.creator !== memberId && hasRole) {
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

      this.logger.log(
        `${snapshot?.proposalId ? `Snapshot ` : ``}Voting period started on ${
          event.collection?.name
        }`,
      );
      const updatedCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug),
      );

      // console.log('event', `${collection.slug}:dataAdded`);
      this.realtime.server.emit(
        `${collection.slug}:votingStarted on ${dataSlug}`,
        updatedCollection,
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

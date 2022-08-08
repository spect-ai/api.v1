import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { WorkThreadCreatedEvent, WorkUnitCreatedEvent } from '../impl';

@EventsHandler(WorkThreadCreatedEvent)
export class WorkThreadCreatedEventHandler
  implements IEventHandler<WorkThreadCreatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(`WorkThreadCreatedEventHandler`);
  }

  async handle(event: WorkThreadCreatedEvent) {
    try {
      console.log('WorkThreadCreatedEventHandler');
      const { card, circleSlug, projectSlug, caller } = event;
      for (const user of card.reviewer) {
        if (user !== caller) {
          this.eventBus.publish(
            new NotificationEvent(
              'submission',
              'card',
              card as Card,
              user,
              [circleSlug, projectSlug, card.slug],
              card.creator,
              null,
            ),
          );
        }
      }
      // this.eventBus.publish(
      //   new UserActivityEvent('create', 'card', card as Card, [], card.creator, {
      //     added: {
      //       title: card.title,
      //     },
      //     deleted: {},
      //     updated: {},
      //   }),
      // );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

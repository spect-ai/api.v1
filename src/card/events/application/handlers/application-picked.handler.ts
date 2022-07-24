import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { ApplicationPickedEvent } from '../impl';

@EventsHandler(ApplicationPickedEvent)
export class ApplicationPickedEventHandler
  implements IEventHandler<ApplicationPickedEvent>
{
  constructor(private readonly eventBus: EventBus) {}

  async handle(event: ApplicationPickedEvent) {
    console.log('ApplicationPickedEventHandler');
    const { card, applicationIds, circleSlug, projectSlug, caller } = event;
    for (const applicationId of applicationIds) {
      this.eventBus.publish(
        new NotificationEvent(
          'pickApplication',
          'card',
          card as Card,
          card.application[applicationId].user,
          [circleSlug, projectSlug, card.slug],
          card.creator,
          null,
        ),
      );
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
  }
}

import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { CardUpdatedEvent } from '../impl';

@EventsHandler(CardUpdatedEvent)
export class CardUpdatedEventHandler
  implements IEventHandler<CardUpdatedEvent>
{
  constructor(private readonly eventBus: EventBus) {}

  async handle(event: CardUpdatedEvent) {
    console.log('CardUpdatedEventHandler');
    const { card, diff, circleSlug, projectSlug } = event;
    const users = [
      ...(diff.added?.assignee || []),
      ...(diff.added?.reviewer || []),
      ...(diff.deleted?.assignee || []),
      ...(diff.deleted?.reviewer || []),
    ];
    for (const user of users) {
      if (user !== card.creator) {
        this.eventBus.publish(
          new NotificationEvent(
            'update',
            'card',
            card as Card,
            user,
            [circleSlug, projectSlug, card.slug],
            card.creator,
            diff,
          ),
        );
      }
    }
    this.eventBus.publish(
      new UserActivityEvent(
        'update',
        'card',
        card as Card,
        [],
        card.creator,
        diff,
      ),
    );
  }
}

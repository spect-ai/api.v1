import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { CardCreatedEvent } from '../impl/card-created.event';

@EventsHandler(CardCreatedEvent)
export class CardCreatedEventHandler
  implements IEventHandler<CardCreatedEvent>
{
  constructor(private readonly eventBus: EventBus) {}

  async handle(event: CardCreatedEvent) {
    console.log('CardCreatedEventHandler');
    const { card, circleSlug, projectSlug } = event;
    for (const user of card.assignee.concat(card.reviewer)) {
      if (user !== card.creator) {
        this.eventBus.publish(
          new NotificationEvent(
            'create',
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
    this.eventBus.publish(
      new UserActivityEvent('create', 'card', card as Card, [], card.creator, {
        added: {
          title: card.title,
        },
        deleted: {},
        updated: {},
      }),
    );
  }
}

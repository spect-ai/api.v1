import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { AddItemCommand } from 'src/users/commands/impl';
import { NotificationEvent } from 'src/users/events/impl';
import { CardCreatedEvent } from '../impl/card-created.event';

@EventsHandler(CardCreatedEvent)
export class CardCreatedEventHandler
  implements IEventHandler<CardCreatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: CardCreatedEvent) {
    console.log('CardCreatedEventHandler');
    const { card, circleSlug, projectSlug } = event;
    const stakeholders = card.assignee.concat(card.reviewer);
    for (const userId of stakeholders) {
      if (userId !== card.creator) {
        this.eventBus.publish(
          new NotificationEvent(
            'create',
            'card',
            card as Card,
            userId,
            [circleSlug, projectSlug, card.slug],
            card.creator,
            null,
          ),
        );
      }
    }

    for (const userId of card.assignee) {
      this.commandBus.execute(
        new AddItemCommand(
          card.creator,
          'assignedCards',
          card.id,
          null,
          userId,
        ),
      );
    }
    for (const userId of card.reviewer) {
      this.commandBus.execute(
        new AddItemCommand(
          card.creator,
          'reviewingCards',
          card.id,
          null,
          userId,
        ),
      );
    }
  }
}

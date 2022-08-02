import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { MoveItemCommand } from 'src/users/commands/impl';
import { NotificationEvent } from 'src/users/events/impl';
import { CardUpdatedEvent } from '../impl';

@EventsHandler(CardUpdatedEvent)
export class CardUpdatedEventHandler
  implements IEventHandler<CardUpdatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: CardUpdatedEvent) {
    console.log('CardUpdatedEventHandler');
    const { card, diff, circleSlug, projectSlug, caller } = event;
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
    if (card.type === 'Bounty') {
      if (diff.added?.assignee) {
        for (const userId of diff.added?.assignee) {
          this.commandBus.execute(
            new MoveItemCommand(
              'activeApplications',
              'pickedApplications',
              card.id,
              null,
              userId,
            ),
          );
        }
      }
      if (diff.deleted?.assignee) {
        for (const userId of diff.deleted?.assignee) {
          this.commandBus.execute(
            new MoveItemCommand(
              'pickedApplications',
              'activeApplications',
              card.id,
              null,
              userId,
            ),
          );
        }
      }
    }
    // this.eventBus.publish(
    //   new UserActivityEvent(
    //     'update',
    //     'card',
    //     card as Card,
    //     [],
    //     card.creator,
    //     diff,
    //   ),
    // );
  }
}

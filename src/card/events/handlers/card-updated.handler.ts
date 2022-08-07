import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { MappedDiff } from 'src/card/types/types';
import { Diff } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { CardLoc } from 'src/project/types/types';
import {
  AddItemsCommand,
  MoveItemCommand,
  RemoveItemsCommand,
} from 'src/users/commands/impl';
import { NotificationEvent } from 'src/users/events/impl';
import { CardUpdatedEvent } from '../impl';

@EventsHandler(CardUpdatedEvent)
export class CardUpdatedEventHandler
  implements IEventHandler<CardUpdatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CardUpdatedEventHandler');
  }

  async handle(event: CardUpdatedEvent) {
    try {
      console.log('CardUpdatedEventHandler');
      const { card, diff, circleSlug, projectSlug, caller } = event;
      const users = [
        ...(diff.added?.assignee || []),
        ...(diff.added?.reviewer || []),
        ...(diff.deleted?.assignee || []),
        ...(diff.deleted?.reviewer || []),
      ];
      this.addCardsToUser(
        card as Card,
        diff.added?.assignee || [],
        'assignedCards',
      );
      this.addCardsToUser(
        card as Card,
        diff.added?.reviewer || [],
        'reviewingCards',
      );
      this.removeCardsFromUser(
        card as Card,
        diff.deleted?.assignee || [],
        'assignedCards',
      );
      this.removeCardsFromUser(
        card as Card,
        diff.deleted?.reviewer || [],
        'reviewingCards',
      );

      this.moveApplications(card as Card, diff);

      this.notifyUsers(users, card as Card, circleSlug, projectSlug, diff);
      this.processClosedCard(card as Card, diff);
      this.processReopenedCard(card as Card, diff);
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }

  addCardsToUser(
    card: Card,
    userIds: string[],
    key: 'assignedCards' | 'reviewingCards',
  ) {
    for (const userId of userIds) {
      this.commandBus.execute(
        new AddItemsCommand(
          [
            {
              fieldName: key,
              itemIds: [card.id],
            },
          ],
          null,
          userId,
        ),
      );
    }
  }

  removeCardsFromUser(
    card: Card,
    userIds: string[],
    key: 'assignedCards' | 'reviewingCards',
  ) {
    for (const userId of userIds) {
      this.commandBus.execute(
        new RemoveItemsCommand(
          [
            {
              fieldName: key,
              itemIds: [card.id],
            },
          ],
          null,
          userId,
        ),
      );
    }
  }

  moveApplications(card: Card, diff: Diff<Card>) {
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
  }

  notifyUsers(
    users: string[],
    card: Card,
    circleSlug: string,
    projectSlug: string,
    diff: Diff<Card>,
  ) {
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
  }

  processClosedCard(card: Card, diff: Diff<Card>) {
    if (diff.updated.status?.active === false) {
      for (const userId of card.assignee) {
        this.commandBus.execute(
          new MoveItemCommand(
            'assignedCards',
            'assignedClosedCards',
            card.id,
            null,
            userId,
          ),
        );
      }
      for (const userId of card.reviewer) {
        this.commandBus.execute(
          new MoveItemCommand(
            'reviewingCards',
            'reviewingClosedCards',
            card.id,
            null,
            userId,
          ),
        );
      }
    }
  }

  processReopenedCard(card: Card, diff: Diff<Card>) {
    if (diff.updated.status?.active === true) {
      for (const userId of card.assignee) {
        this.commandBus.execute(
          new MoveItemCommand(
            'assignedClosedCards',
            'assignedCards',
            card.id,
            null,
            userId,
          ),
        );
      }
      for (const userId of card.reviewer) {
        this.commandBus.execute(
          new MoveItemCommand(
            'reviewingClosedCards',
            'reviewingCards',
            card.id,
            null,
            userId,
          ),
        );
      }
    }
  }
}

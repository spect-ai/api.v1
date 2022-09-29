import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { LoggingService } from 'src/logging/logging.service';
import { GetDetailedProjectByIdQuery } from 'src/project/queries/impl';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { AddItemsCommand } from 'src/users/commands/impl';
import { NotificationEvent } from 'src/users/events/impl';
import { CardCreatedEvent } from '../impl/card-created.event';

@EventsHandler(CardCreatedEvent)
export class CardCreatedEventHandler
  implements IEventHandler<CardCreatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.logger.setContext('CardCreatedEventHandler');
  }

  async handle(event: CardCreatedEvent) {
    try {
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
          new AddItemsCommand(
            [
              {
                fieldName: 'assignedCards',
                itemIds: [card.id],
              },
            ],
            null,
            userId,
          ),
        );
      }
      for (const userId of card.reviewer) {
        this.commandBus.execute(
          new AddItemsCommand(
            [
              {
                fieldName: 'reviewingCards',
                itemIds: [card.id],
              },
            ],
            null,
            userId,
          ),
        );
      }
      const project = await this.queryBus.execute(
        new GetDetailedProjectByIdQuery((card as any).project),
      );
      this.realtime.server.emit('projectUpdate', project);
      this.logger.log(`Created Card: ${event.card?.title}`);
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

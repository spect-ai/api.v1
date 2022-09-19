import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { LoggingService } from 'src/logging/logging.service';
import { Project } from 'src/project/model/project.model';
import { GetProjectBySlugQuery } from 'src/project/queries/impl';
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
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('CardCreatedEventHandler');
  }

  async handle(event: CardCreatedEvent) {
    try {
      console.log('CardCreatedEventHandler');
      const { card, circleSlug, projectSlug } = event;
      // const stakeholders = card.properties['assignee'].concat(
      //   card.properties['reviewer'],
      // );
      const project: Project = await this.queryBus.execute(
        new GetProjectBySlugQuery(projectSlug),
      );

      let stakeholders = [];
      Object.keys(project.properties).map((key) => {
        if (
          project.properties[key].type === 'user[]' ||
          project.properties[key].type === 'user'
        ) {
          stakeholders = [...stakeholders, ...(card.properties[key] || [])];
        }
      });

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

      for (const userId of card.properties['assignee']) {
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
      for (const userId of card.properties['reviewer']) {
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
      this.logger.log(`Created Card: ${event.card?.title}`);
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

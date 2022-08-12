import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { LoggingService } from 'src/logging/logging.service';
import { AddItemsCommand, MoveItemCommand } from 'src/users/commands/impl';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { ApplicationPickedEvent } from '../impl';

@EventsHandler(ApplicationPickedEvent)
export class ApplicationPickedEventHandler
  implements IEventHandler<ApplicationPickedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ApplicationPickedEventHandler');
  }

  async handle(event: ApplicationPickedEvent) {
    try {
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
        this.commandBus.execute(
          new MoveItemCommand(
            'activeApplications',
            'pickedApplications',
            card.id,
            null,
            card.application[applicationId].user,
          ),
        );

        this.commandBus.execute(
          new AddItemsCommand([
            {
              fieldName: 'assignedCards',
              itemIds: [card.id],
            },
          ]),
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
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

import {
  EventBus,
  CommandBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { Retro } from 'src/retro/models/retro.model';
import { AddItemsCommand } from 'src/users/commands/impl';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { RetroCreatedEvent } from '../impl';

@EventsHandler(RetroCreatedEvent)
export class RetroCreatedEventHandler
  implements IEventHandler<RetroCreatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(`RetroCreatedEventHandler`);
  }

  async handle(event: RetroCreatedEvent) {
    try {
      console.log('RetroCreatedEventHandler');
      const { retro, circleSlug } = event;
      for (const member of retro.members) {
        if (member !== retro.creator) {
          this.eventBus.publish(
            new NotificationEvent(
              'create',
              'retro',
              retro as Retro,
              member,
              [circleSlug, retro.slug],
              retro.creator,
              null,
            ),
          );
        }
      }
      for (const member of retro.members) {
        this.commandBus.execute(
          new AddItemsCommand(
            [
              {
                fieldName: 'retro',
                itemIds: [retro.id],
              },
            ],
            null,
            member,
          ),
        );
      }

      // this.eventBus.publish(
      //   new UserActivityEvent(
      //     'create',
      //     'retro',
      //     retro as Retro,
      //     [],
      //     retro.creator,
      //     {
      //       added: {
      //         title: retro.title,
      //       },
      //       deleted: {},
      //       updated: {},
      //     },
      //   ),
      // );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

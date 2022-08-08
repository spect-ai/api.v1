import { EventBus, EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { Retro } from 'src/retro/models/retro.model';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { RetroUpdatedEvent } from '../impl';

@EventsHandler(RetroUpdatedEvent)
export class RetroUpdatedEventHandler
  implements IEventHandler<RetroUpdatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(`RetroUpdatedEventHandler`);
  }

  async handle(event: RetroUpdatedEvent) {
    try {
      console.log('RetroUpdatedEventHandler');
      const { retro, diff, caller } = event;
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(retro.circle),
      );
      for (const member of retro.members) {
        if (member !== caller) {
          this.eventBus.publish(
            new NotificationEvent(
              'update',
              'retro',
              retro as Retro,
              member,
              [circle.slug, retro.slug],
              retro.creator,
              null,
            ),
          );
        }
      }
      this.eventBus.publish(
        new UserActivityEvent(
          'update',
          'retro',
          retro as Retro,
          [],
          retro.creator,
          diff,
        ),
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

import { EventBus, EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { Retro } from 'src/retro/models/retro.model';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { RetroEndedEvent } from '../impl';

@EventsHandler(RetroEndedEvent)
export class RetroEndedEventHandler implements IEventHandler<RetroEndedEvent> {
  constructor(
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(`RetroEndedEventHandler`);
  }

  async handle(event: RetroEndedEvent) {
    try {
      console.log('RetroEndedEventHandler');
      const { retro, caller } = event;
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(retro.circle),
      );
      for (const member of retro.members) {
        if (member !== caller) {
          this.eventBus.publish(
            new NotificationEvent(
              'end',
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
          'end',
          'retro',
          retro as Retro,
          [],
          retro.creator,
          {
            added: {},
            deleted: {},
            updated: {},
          },
        ),
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

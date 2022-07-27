import { EventBus, EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle-v1/queries/impl';
import { Retro } from 'src/retro/models/retro.model';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { RetroEndedEvent } from '../impl';

@EventsHandler(RetroEndedEvent)
export class RetroEndedEventHandler implements IEventHandler<RetroEndedEvent> {
  constructor(
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus,
  ) {}

  async handle(event: RetroEndedEvent) {
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
      new UserActivityEvent('end', 'retro', retro as Retro, [], retro.creator, {
        added: {},
        deleted: {},
        updated: {},
      }),
    );
  }
}

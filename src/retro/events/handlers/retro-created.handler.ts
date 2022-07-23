import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Retro } from 'src/retro/models/retro.model';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { RetroCreatedEvent } from '../impl';

@EventsHandler(RetroCreatedEvent)
export class RetroCreatedEventHandler
  implements IEventHandler<RetroCreatedEvent>
{
  constructor(private readonly eventBus: EventBus) {}

  async handle(event: RetroCreatedEvent) {
    console.log('RetroCreatedEventHandler');
    const { retro, circleSlug } = event;
    for (const member of retro.members) {
      this.eventBus.publish(
        new NotificationEvent(
          'createRetro',
          member,
          [circleSlug, retro.slug],
          retro.creator,
          retro.title,
        ),
      );
    }
    this.eventBus.publish(
      new UserActivityEvent(
        'create',
        'retro',
        retro as Retro,
        [],
        retro.creator,
        {
          added: {
            title: retro.title,
          },
          deleted: {},
          updated: {},
        },
      ),
    );
  }
}

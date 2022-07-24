import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { WorkUnitCreatedEvent } from '../impl';

@EventsHandler(WorkUnitCreatedEvent)
export class WorkUnitCreatedEventHandler
  implements IEventHandler<WorkUnitCreatedEvent>
{
  constructor(private readonly eventBus: EventBus) {}

  async handle(event: WorkUnitCreatedEvent) {
    console.log('WorkUnitCreatedEventHandler');
    const {
      card,
      createWorkUnitRequestDto,
      circleSlug,
      projectSlug,
      caller,
      workThreadId,
    } = event;
    for (const user of card.reviewer) {
      if (user !== caller && createWorkUnitRequestDto.type === 'submission') {
        this.eventBus.publish(
          new NotificationEvent(
            createWorkUnitRequestDto.type,
            'card',
            card as Card,
            user,
            [circleSlug, projectSlug, card.slug],
            caller,
            null,
          ),
        );
      }
    }
    if (['revision', 'feedback'].includes(createWorkUnitRequestDto.type)) {
      const thread = card.workThreads[workThreadId];
      const workUnitId = thread.workUnitOrder[thread.workUnitOrder.length - 2];
      this.eventBus.publish(
        new NotificationEvent(
          createWorkUnitRequestDto.type,
          'card',
          card as Card,
          thread.workUnits[workUnitId].user,
          [],
          caller,
          null,
        ),
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
  }
}

import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationEvent, UserActivityEvent } from 'src/users/events/impl';
import { WorkUnitCreatedEvent } from '../impl';

@EventsHandler(WorkUnitCreatedEvent)
export class WorkUnitCreatedEventHandler
  implements IEventHandler<WorkUnitCreatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(`WorkUnitCreatedEventHandler`);
  }

  async handle(event: WorkUnitCreatedEvent) {
    try {
      console.log('WorkUnitCreatedEventHandler');
      const {
        card,
        createWorkUnitRequestDto,
        circleSlug,
        projectSlug,
        caller,
        workThreadId,
      } = event;
      for (const user of card.properties['reviewer'].value) {
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
        const workUnitId =
          thread.workUnitOrder[thread.workUnitOrder.length - 2];
        this.eventBus.publish(
          new NotificationEvent(
            createWorkUnitRequestDto.type,
            'card',
            card as Card,
            thread.workUnits[workUnitId].user,
            [circleSlug, projectSlug, card.slug],
            caller,
            null,
          ),
        );
      }
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

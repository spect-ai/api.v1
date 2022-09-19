import { EventBus, EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { LoggingService } from 'src/logging/logging.service';
import { Project } from 'src/project/model/project.model';
import { GetProjectBySlugQuery } from 'src/project/queries/impl';
import { NotificationEvent } from 'src/users/events/impl';
import { WorkThreadCreatedEvent } from '../impl';

@EventsHandler(WorkThreadCreatedEvent)
export class WorkThreadCreatedEventHandler
  implements IEventHandler<WorkThreadCreatedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext(`WorkThreadCreatedEventHandler`);
  }

  async handle(event: WorkThreadCreatedEvent) {
    try {
      console.log('WorkThreadCreatedEventHandler');
      const { card, circleSlug, projectSlug, caller } = event;

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

      for (const user of stakeholders) {
        if (user !== caller) {
          this.eventBus.publish(
            new NotificationEvent(
              'submission',
              'card',
              card as Card,
              user,
              [circleSlug, projectSlug, card.slug],
              card.creator,
              null,
            ),
          );
        }
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

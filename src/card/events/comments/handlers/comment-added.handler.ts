import { EventBus, EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { Project } from 'src/project/model/project.model';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { NotificationEvent } from 'src/users/events/impl';
import { CommentAddedEvent } from '../impl';

@EventsHandler(CommentAddedEvent)
export class CommentAddedEventHandler
  implements IEventHandler<CommentAddedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('CommentAddedEventHandler');
  }

  async handle(event: CommentAddedEvent) {
    try {
      console.log('CommentAddedEventHandler');
      const { card, comment, caller } = event;
      // let notifRecepients = [
      //   ...(card.properties['assignee'] || []),
      //   ...(card.properties['reviewer'] || []),
      // ];
      // notif recepients are all the user types in the card
      const project: Project = await this.queryBus.execute(
        new GetProjectByIdQuery(card.project as string),
      );
      let notifRecepients = [];
      Object.keys(project.properties).map((key) => {
        if (
          project.properties[key].type === 'user[]' ||
          project.properties[key].type === 'user'
        ) {
          notifRecepients = [
            ...notifRecepients,
            ...(card.properties[key] || []),
          ];
        }
      });
      notifRecepients = [...new Set(notifRecepients)];
      for (const recepient of notifRecepients) {
        if (recepient !== caller)
          this.eventBus.publish(
            new NotificationEvent(
              'addComment',
              'card',
              card as Card,
              recepient,
              [],
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

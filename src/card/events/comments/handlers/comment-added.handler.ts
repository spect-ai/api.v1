import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationEvent } from 'src/users/events/impl';
import { CommentAddedEvent } from '../impl';

@EventsHandler(CommentAddedEvent)
export class CommentAddedEventHandler
  implements IEventHandler<CommentAddedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('CommentAddedEventHandler');
  }

  async handle(event: CommentAddedEvent) {
    try {
      console.log('CommentAddedEventHandler');
      const { card, comment, caller } = event;
      let notifRecepients = [
        ...(card.assignee || []),
        ...(card.reviewer || []),
      ];
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

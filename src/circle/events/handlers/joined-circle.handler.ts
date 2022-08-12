import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { LoggingService } from 'src/logging/logging.service';
import { AddItemsCommand as AddItemsToUserCommand } from 'src/users/commands/impl';
import { JoinedCircleEvent } from '../impl';

@EventsHandler(JoinedCircleEvent)
export class JoinedCircleEventHandler
  implements IEventHandler<JoinedCircleEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('JoinedCircleEventHandler');
  }

  async handle(event: JoinedCircleEvent) {
    try {
      console.log('JoinedCircleEventHandler');
      const { userId, circle, id } = event;
      let updatedCircle = circle;
      if (!updatedCircle) {
        updatedCircle = await this.circlesRepository.findById(id);
      }
      this.commandBus.execute(
        new AddItemsToUserCommand(
          [
            {
              fieldName: 'circles',
              itemIds: [updatedCircle.id],
            },
          ],
          null,
          userId,
        ),
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

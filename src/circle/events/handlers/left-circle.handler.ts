import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { LoggingService } from 'src/logging/logging.service';
import { RemoveItemsCommand as RemoveItemsFromUserCommand } from 'src/users/commands/impl';
import { LeftCircleEvent } from '../impl';

@EventsHandler(LeftCircleEvent)
export class LeftCircleEventHandler implements IEventHandler<LeftCircleEvent> {
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('LeftCircleEventHandler');
  }

  async handle(event: LeftCircleEvent) {
    try {
      console.log('LeftCircleEventHandler');
      const { userId, circle, id } = event;
      let updatedCircle = circle;
      if (!updatedCircle) {
        updatedCircle = await this.circlesRepository.findById(id);
      }
      this.commandBus.execute(
        new RemoveItemsFromUserCommand(
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

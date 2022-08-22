import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UpdatedCircleEvent } from '../impl/updated-circle.event';

@EventsHandler(UpdatedCircleEvent)
export class UpdatedCircleEventHandler
  implements IEventHandler<UpdatedCircleEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdatedCircleEventHandler');
  }

  async handle(event: UpdatedCircleEvent) {
    try {
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

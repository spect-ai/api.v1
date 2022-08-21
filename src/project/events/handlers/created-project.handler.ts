import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CreatedProjectEvent } from '../impl';

@EventsHandler(CreatedProjectEvent)
export class CreatedProjectEventHandler
  implements IEventHandler<CreatedProjectEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreatedProjectEventHandler');
  }

  async handle(event: CreatedProjectEvent) {
    try {
      console.log('CreatedProjectEvent');
      const { caller, project } = event;

      this.logger.log(`Created Project: ${event.project?.name}`);
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

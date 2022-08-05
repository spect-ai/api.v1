import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { AddItemsCommand as AddItemsToUserCommand } from 'src/users/commands/impl';
import { CreatedCircleEvent } from '../impl';

@EventsHandler(CreatedCircleEvent)
export class CreatedCircleEventHandler
  implements IEventHandler<CreatedCircleEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly circlesRepository: CirclesRepository,
  ) {}

  async handle(event: CreatedCircleEvent) {
    console.log('CreatedCircleEvent');
    const { caller, circle } = event;

    this.commandBus.execute(
      new AddItemsToUserCommand(
        [
          {
            fieldName: 'circles',
            itemIds: [circle._id.toString()],
          },
        ],
        null,
        caller,
      ),
    );
  }
}

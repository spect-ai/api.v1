import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
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
  ) {}

  async handle(event: JoinedCircleEvent) {
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
            fieldName: 'memberOfCircles',
            itemIds: [updatedCircle.id],
          },
        ],
        null,
        userId,
      ),
    );
  }
}

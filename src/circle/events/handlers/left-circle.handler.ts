import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { RemoveItemsCommand as RemoveItemsFromUserCommand } from 'src/users/commands/impl';
import { LeftCircleEvent } from '../impl';

@EventsHandler(LeftCircleEvent)
export class LeftCircleEventHandler implements IEventHandler<LeftCircleEvent> {
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly circlesRepository: CirclesRepository,
  ) {}

  async handle(event: LeftCircleEvent) {
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

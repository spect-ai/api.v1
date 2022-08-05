import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { RemoveItemsCommand as RemoveItemsFromUserCommand } from 'src/users/commands/impl';
import { CardsArchivedEvent } from '../impl/card-archived.event';

@EventsHandler(CardsArchivedEvent)
export class CardsArchivedEventHandler
  implements IEventHandler<CardsArchivedEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: CardsArchivedEvent) {
    console.log('CardsArchivedEventHandler');
    const { cards } = event;
    console.log(cards);
    for (const card of cards) {
      for (const assignee of card.assignee) {
        await this.commandBus.execute(
          new RemoveItemsFromUserCommand(
            [
              {
                fieldName: 'assignedCards',
                itemIds: [card._id.toString()],
              },
            ],
            null,
            assignee,
          ),
        );
      }
      for (const reviewer of card.reviewer) {
        await this.commandBus.execute(
          new RemoveItemsFromUserCommand(
            [
              {
                fieldName: 'reviewingCards',
                itemIds: [card._id.toString()],
              },
            ],
            null,
            reviewer,
          ),
        );
      }
    }
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { RemoveCardsCommand } from 'src/project/commands/impl';
import { DeleteCardByIdCommand } from '../impl/delete-card.command';

@CommandHandler(DeleteCardByIdCommand)
export class DeleteCardByIdCommandHandler
  implements ICommandHandler<DeleteCardByIdCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: DeleteCardByIdCommand): Promise<boolean> {
    try {
      const card = await this.cardsRepository.getCardWithAllChildren(
        command.id,
      );
      const cardIds = [
        ...card.flattenedChildren.map((c) => c._id.toString()),
        command.id,
      ] as string[];

      const deleted = await this.cardsRepository.deleteMany({
        _id: {
          $in: cardIds,
        },
      });
      console.log(deleted);
      if (deleted.hasWriteErrors()) {
        throw new InternalServerErrorException(deleted.getWriteErrors());
      }

      const deletedFromProject = await this.commandBus.execute(
        new RemoveCardsCommand(cardIds, null, card.project),
      );
      if (!deletedFromProject) {
        throw new InternalServerErrorException(
          `Could not delete cards ${JSON.stringify(cardIds)} from project`,
        );
      }

      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

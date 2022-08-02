import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { Card, ExtendedCard } from 'src/card/model/card.model';
import { CommonTools } from 'src/common/common.service';
import { RemoveCardsCommand } from 'src/project/commands/impl';
import {
  DeleteCardByIdCommand,
  DeleteMultipleCardsByIdCommand,
} from '../impl/delete-card.command';

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
      let card: ExtendedCard;
      let cardIds = [];
      if (command.deleteSubcards) {
        card = await this.cardsRepository.getCardWithAllChildren(command.id);

        cardIds = [
          ...card.flattenedChildren.map((c) => c._id.toString()),
          command.id,
        ] as string[];
      } else {
        cardIds = [command.id];
      }

      const deleted = await this.cardsRepository.deleteMany({
        _id: {
          $in: cardIds,
        },
      });
      console.log(deleted);
      if (deleted.hasWriteErrors()) {
        throw new InternalServerErrorException(deleted.getWriteErrors());
      }

      if (command.deleteFromProject) {
        const deletedFromProject = await this.commandBus.execute(
          new RemoveCardsCommand(cardIds, null, card.project),
        );
        if (!deletedFromProject) {
          throw new InternalServerErrorException(
            `Could not delete cards ${JSON.stringify(cardIds)} from project`,
          );
        }
      }

      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

@CommandHandler(DeleteMultipleCardsByIdCommand)
export class DeleteMultipleCardsByIdHandler
  implements ICommandHandler<DeleteMultipleCardsByIdCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(command: DeleteMultipleCardsByIdCommand): Promise<boolean> {
    try {
      let cards: ExtendedCard[] = [];
      let cardIds = [];
      if (command.deleteSubcards) {
        cards =
          await this.cardsRepository.getCardWithAllChildrenForMultipleCards(
            command.ids,
          );

        for (const card of cards) {
          cardIds = [
            ...cardIds,
            ...card.flattenedChildren.map((c) => c._id.toString()),
            card.id,
          ] as string[];
        }
      } else {
        cardIds = command.ids;
      }

      const deleted = await this.cardsRepository.deleteMany({
        _id: {
          $in: cardIds,
        },
      });
      console.log(deleted);
      if (deleted.hasWriteErrors()) {
        throw new InternalServerErrorException(deleted.getWriteErrors());
      }

      if (command.deleteFromProject) {
        let projectToCards = {};
        for (const card of cards) {
          projectToCards = this.commonTools.setOrAppend(
            projectToCards,
            card.project,
            card.id,
          );
        }

        for (const [projectId, cardIds] of Object.entries(projectToCards)) {
          const deletedFromProject = await this.commandBus.execute(
            new RemoveCardsCommand(cardIds as string[], null, projectId),
          );
        }
      }

      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

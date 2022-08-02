import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { Card } from 'src/card/model/card.model';
import { AddCardsCommand, RemoveCardsCommand } from 'src/project/commands/impl';
import { Project } from 'src/project/model/project.model';
import { RevertArchiveCardByIdCommand } from '../impl/revert-archival.command';

@CommandHandler(RevertArchiveCardByIdCommand)
export class RevertArchiveCardByIdCommandHandler
  implements ICommandHandler<RevertArchiveCardByIdCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: RevertArchiveCardByIdCommand,
  ): Promise<{ project: Project; cardIds: string[] }> {
    try {
      const cardWithChildren =
        await this.cardsRepository.getCardWithAllChildren(command.id);
      console.log(cardWithChildren);
      const cards = [
        ...cardWithChildren.flattenedChildren,
        cardWithChildren,
      ] as Card[];
      const cardIds = cards.map((c) => c._id.toString());

      const updatedProject = await this.commandBus.execute(
        new AddCardsCommand(cards, null, cardWithChildren.project),
      );

      /** Mongo only returns an acknowledgment on update many and not the updated records itself */
      const updateAcknowledgment = await this.cardsRepository.updateMany(
        {
          _id: { $in: cardIds },
        },
        {
          $set: {
            'status.archived': false,
            'status.active': true,
          },
        },
        {
          multi: true,
        },
      );

      console.log(updateAcknowledgment);

      if (!updateAcknowledgment.acknowledged) {
        throw new HttpException(
          'Something went wrong while updating payment info',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return {
        project: updatedProject,
        cardIds,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

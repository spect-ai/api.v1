import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { RemoveCardsCommand } from 'src/project/commands/impl';
import { Project } from 'src/project/model/project.model';
import { ArchiveCardByIdCommand } from '../impl/archive-card.command';

@CommandHandler(ArchiveCardByIdCommand)
export class ArchiveCardByIdCommandHandler
  implements ICommandHandler<ArchiveCardByIdCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: ArchiveCardByIdCommand,
  ): Promise<{ project: Project; cardIds: string[] }> {
    try {
      let cardIds = [];
      const card = await this.cardsRepository.getCardWithAllChildren(
        command.id,
      );

      cardIds = [
        ...card.flattenedChildren.map((c) => c._id.toString()),
        command.id,
      ] as string[];

      const updatedProject = await this.commandBus.execute(
        new RemoveCardsCommand(cardIds, null, card.project),
      );

      /** Mongo only returns an acknowledgment on update and not the updated records itself */
      const updateAcknowledgment = await this.cardsRepository.updateMany(
        {
          _id: { $in: cardIds },
        },
        {
          $set: {
            'status.archived': true,
            'status.active': false,
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

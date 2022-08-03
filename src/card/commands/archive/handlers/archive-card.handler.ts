import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { Card } from 'src/card/model/card.model';
import { RemoveCardsCommand } from 'src/project/commands/impl';
import { Project } from 'src/project/model/project.model';
import { RemoveItemsCommand } from '../../items/impl/remove-items.command';
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
  ): Promise<{ project: Project; cards: Card[] }> {
    try {
      const cardWithChildren =
        await this.cardsRepository.getCardWithAllChildren(command.id);

      const cards = [
        ...cardWithChildren.flattenedChildren,
        cardWithChildren,
      ] as Card[];
      const cardIds = cards.map((c) => c._id.toString());

      const updatedProject = await this.commandBus.execute(
        new RemoveCardsCommand(cardIds, null, cardWithChildren.project),
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
          'Something went wrong while archving card',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (cardWithChildren.parent) {
        await this.commandBus.execute(
          new RemoveItemsCommand(
            [
              {
                fieldName: 'children',
                itemIds: [cardWithChildren._id.toString()],
              },
            ],
            null,
            cardWithChildren.parent,
          ),
        );
      }
      return {
        project: updatedProject,
        cards,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

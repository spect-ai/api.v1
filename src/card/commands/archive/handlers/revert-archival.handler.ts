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
import { AddItemsCommand } from '../../items/impl/add-items.command';
import { RevertArchivedCardCommand } from '../impl/revert-archival.command';

@CommandHandler(RevertArchivedCardCommand)
export class RevertArchivedCardCommandHandler
  implements ICommandHandler<RevertArchivedCardCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: RevertArchivedCardCommand,
  ): Promise<{ project: Project; cards: Card[] }> {
    try {
      const { id, card } = command;
      let cardWithChildren = card;
      if (!cardWithChildren || !cardWithChildren.flattenedChildren)
        cardWithChildren = await this.cardsRepository.getCardWithAllChildren(
          id,
        );
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
      if (cardWithChildren.parent) {
        await this.commandBus.execute(
          new AddItemsCommand(
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

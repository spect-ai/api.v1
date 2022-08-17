import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { CardsArchivedEvent } from 'src/card/events/impl';
import { Card } from 'src/card/model/card.model';
import { GetMultipleCardsWithChildrenQuery } from 'src/card/queries/impl';
import { CommonTools } from 'src/common/common.service';
import {
  RemoveCardsCommand,
  RemoveCardsInMultipleProjectsCommand,
} from 'src/project/commands/impl';
import { Project } from 'src/project/model/project.model';
import { RemoveItemsCommand } from '../../items/impl/remove-items.command';
import {
  ArchiveCardByIdCommand,
  ArchiveMultipleCardsByIdCommand,
} from '../impl/archive-card.command';

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

@CommandHandler(ArchiveMultipleCardsByIdCommand)
export class ArchiveMultipleCardsByIdCommandHandler
  implements ICommandHandler<ArchiveMultipleCardsByIdCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ArchiveMultipleCardsByIdCommand): Promise<boolean> {
    try {
      const { ids, removeFromProject } = command;
      const cardsWithChildren = await this.queryBus.execute(
        new GetMultipleCardsWithChildrenQuery(command.ids),
      );
      let cards = [] as Card[];

      for (const cardWithChildren of cardsWithChildren) {
        cards = [
          ...cards,
          ...cardWithChildren.flattenedChildren,
          cardWithChildren,
        ];
      }
      const cardIds = cards.map((c) => c._id.toString());

      if (removeFromProject) {
        let projectIdToCardsIds = {};
        for (const card of cards) {
          projectIdToCardsIds = this.commonTools.setOrAppend(
            projectIdToCardsIds,
            card.project,
            card._id.toString(),
          );
        }
        const updatedProject = await this.commandBus.execute(
          new RemoveCardsInMultipleProjectsCommand(projectIdToCardsIds),
        );
      }

      /** Mongo only returns an acknowledgment on update and not the updated records itself */
      const updateAcknowledgment = await this.cardsRepository.updateMany(
        {
          _id: { $in: cardIds },
        },
        {
          $set: {
            'status.archived': true,
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

      for (const cardWithChildren of cardsWithChildren) {
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
      }

      this.eventBus.publish(new CardsArchivedEvent(cards));

      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

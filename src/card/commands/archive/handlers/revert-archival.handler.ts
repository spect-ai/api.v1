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
import { CardArchivalRevertedEvent } from 'src/card/events/impl';
import { Card } from 'src/card/model/card.model';
import { GetMultipleCardsWithChildrenQuery } from 'src/card/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import {
  AddCardsCommand,
  AddCardsInMultipleProjectsCommand,
  RemoveCardsCommand,
} from 'src/project/commands/impl';
import { Project } from 'src/project/model/project.model';
import { AddItemsCommand } from '../../items/impl/add-items.command';
import {
  RevertArchivalMultipleCardsByIdCommand,
  RevertArchiveCardByIdCommand,
} from '../impl/revert-archival.command';

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

@CommandHandler(RevertArchivalMultipleCardsByIdCommand)
export class RevertArchivalMultipleCardsByIdCommandHandler
  implements ICommandHandler<RevertArchivalMultipleCardsByIdCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RevertArchivalMultipleCardsByIdCommandHandler');
  }

  async execute(
    command: RevertArchivalMultipleCardsByIdCommand,
  ): Promise<boolean> {
    try {
      const { ids, addToProject } = command;

      const cardsWithChildren = await this.queryBus.execute(
        new GetMultipleCardsWithChildrenQuery(ids),
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

      if (addToProject) {
        let projectIdToCards = {};
        for (const card of cards) {
          projectIdToCards = this.commonTools.setOrAppend(
            projectIdToCards,
            card.project,
            card,
          );
        }
        const updatedProject = await this.commandBus.execute(
          new AddCardsInMultipleProjectsCommand(projectIdToCards),
        );
      }

      /** Mongo only returns an acknowledgment on update and not the updated records itself */
      const updateAcknowledgment = await this.cardsRepository.updateMany(
        {
          _id: { $in: cardIds },
        },
        {
          $set: {
            'status.archived': false,
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
        try {
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
        } catch (error) {
          this.logger.error(error.message);
        }
      }

      this.eventBus.publish(new CardArchivalRevertedEvent(cards));

      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

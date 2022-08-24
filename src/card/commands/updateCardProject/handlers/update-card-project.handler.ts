import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { Card } from 'src/card/model/card.model';
import { AddCardsCommand, RemoveCardsCommand } from 'src/project/commands/impl';
import { RemoveItemsCommand } from '../../impl';
import { UpdateProjectCardCommand } from '../impl/update-card-project.command';
import { v4 as uuidv4 } from 'uuid';
import { Activity } from 'src/common/types/activity.type';
import { Project } from 'src/project/model/project.model';

@CommandHandler(UpdateProjectCardCommand)
export class UpdateProjectCardCommandHandler
  implements ICommandHandler<UpdateProjectCardCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: UpdateProjectCardCommand): Promise<Card> {
    try {
      const { id, projectId, caller } = command;

      const cardWithChildren =
        await this.cardsRepository.getCardWithAllChildren(id);

      const cards = [
        ...cardWithChildren.flattenedChildren,
        cardWithChildren,
      ] as Card[];
      const cardIds = cards.map((c) => c._id.toString());

      const updatedProject = await this.commandBus.execute(
        new RemoveCardsCommand(
          [cardWithChildren.id],
          null,
          cardWithChildren.project,
        ),
      );

      const updatedNewProject: Project = await this.commandBus.execute(
        new AddCardsCommand([cardWithChildren], null, projectId),
      );

      /** Mongo only returns an acknowledgment on update and not the updated records itself */
      const updateAcknowledgment = await this.cardsRepository.updateMany(
        {
          _id: { $in: cardIds },
        },
        {
          $set: {
            project: projectId,
          },
        },
        {
          multi: true,
        },
      );

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

      const activity = {
        changeLog: {},
        activityId: 'updateProject',
        timestamp: new Date(),
        actorId: caller,
        commitId: uuidv4(),
        comment: false,
        content: `moved card to ${updatedNewProject.name}`,
      } as Activity;

      let slugNum = await this.cardsRepository.count({
        project: projectId,
      });
      slugNum--;
      for (const cId of cardIds) {
        const oldCard = await this.cardsRepository.getCardById(cId);
        const newActitvity = [...oldCard.activity, activity];
        const newCard = await this.cardsRepository.updateById(cId, {
          activity: newActitvity,
          slug: `${updatedNewProject.slug}-${slugNum.toString()}`,
        });
        slugNum--;
      }

      const updatedCard = await this.cardsRepository.getCardById(id);
      return updatedCard;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

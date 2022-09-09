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
import { PerformMultipleAutomationsCommand } from 'src/automation/commands/impl';
import { MultipleItemContainer } from 'src/automation/types/types';
import { CardsRepository } from 'src/card/cards.repository';
import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { CardUpdatedEvent } from 'src/card/events/impl';
import { Card } from 'src/card/model/card.model';
import { GetMultipleCardsByIdsQuery } from 'src/card/queries/impl';
import { ActivityBuilder } from 'src/card/services/activity-builder.service';
import { CardsService } from 'src/card/services/cards.service';
import { CommonUpdateService } from 'src/card/services/common-update.service';
import { ResponseBuilder } from 'src/card/services/response.service';
import { Circle } from 'src/circle/model/circle.model';
import { GetMultipleCirclesQuery } from 'src/circle/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { MappedItem, MappedPartialItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { ReorderCardReqestDto } from 'src/project/dto/reorder-card-request.dto';
import { Project } from 'src/project/model/project.model';
import { GetMultipleProjectsQuery } from 'src/project/queries/impl';
import {
  UpdateCardCommand,
  UpdateMultipleCardsCommand,
} from '../impl/update-card.command';
@CommandHandler(UpdateCardCommand)
export class UpdateCardCommandHandler
  implements ICommandHandler<UpdateCardCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
    private readonly commonTools: CommonTools,
    private readonly cardsProjectService: CardsProjectService,
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus,
    private readonly responseBuilder: ResponseBuilder,
    private readonly cardsService: CardsService,
    private readonly commonUpdateService: CommonUpdateService,
    private readonly activityBuilder: ActivityBuilder,
  ) {}

  async execute(
    command: UpdateCardCommand,
  ): Promise<DetailedCardResponseDto | MultipleItemContainer> {
    try {
      const { card, project, circle, caller, commit } = command;
      const updateCardDto = this.distinctifyArrayFields(command.updateCardDto);
      let updatedCard = this.getUpdatedCard(
        caller,
        card,
        project,
        updateCardDto,
      );
      let updatedProject = this.getUpdatedProject(card, project, updateCardDto);

      const objectifiedCard = this.commonTools.objectify([card], 'id');
      const flattenedUpdate = this.commonTools.flatten(updatedCard);

      const multipleItemContainer: MultipleItemContainer =
        await this.commandBus.execute(
          new PerformMultipleAutomationsCommand(
            flattenedUpdate,
            objectifiedCard,
            caller,
            {
              [card.id]: project,
            },
            {
              [card.id]: circle,
            },
          ),
        );

      updatedCard = this.cardsService.merge(
        updatedCard,
        multipleItemContainer.cards,
      ) as MappedPartialItem<Card>;
      updatedProject = this.cardsService.merge(
        updatedProject,
        multipleItemContainer.projects,
      ) as MappedPartialItem<Project>;
      if (commit) {
        await this.commonUpdateService.execute(updatedCard, updatedProject);
        const resultingCard =
          await this.cardsRepository.getCardWithPopulatedReferences(card.id);

        const cardIdsToFetch = Object.keys(updatedCard).filter(
          (cId) => cId !== card.id,
        );
        let cardsUpdated = await this.queryBus.execute(
          new GetMultipleCardsByIdsQuery(cardIdsToFetch),
        );
        cardsUpdated = [...(cardsUpdated || []), resultingCard];
        for (const card of cardsUpdated) {
          const diff = this.cardsService.getDifference(
            card,
            updatedCard[card.id],
          );

          this.eventBus.publish(
            new CardUpdatedEvent(card, diff, circle.slug, project.slug, caller),
          );
        }

        return this.responseBuilder.enrichResponse(resultingCard);
      } else {
        return {
          cards: updatedCard,
          projects: updatedProject,
        };
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  getUpdatedCard(
    caller: string,
    card: Card,
    project: Project,
    updateCardDto: UpdateCardRequestDto,
  ): MappedPartialItem<Card> {
    const activities = this.activityBuilder.buildUpdatedCardActivity(
      caller,
      updateCardDto,
      card,
      project,
    );
    const updatedActivity = [...card.activity, ...activities];

    if (updateCardDto.columnId) {
      if (!project.columnOrder.includes(updateCardDto.columnId))
        throw new HttpException(
          'Column Id must be in the project column order',
          HttpStatus.NOT_FOUND,
        );
    }
    const res = {
      [card.id]: {
        ...updateCardDto,
        activity: updatedActivity,
      },
    };

    /**
     * Only add status and rewards when there is an update, otherwise it affects the automation workflow
     * in case there is a status update due to some automaion. This is because the normal card update is always given higher priority
     * over the updates due to the automation workflow.
     * Updating status and rewards like following makes sure partial updates are supported. For example, reward can be update by
     * just passing one property of reward like 'chain' or 'value'.
     */
    if (updateCardDto.status) {
      res[card.id].status = {
        ...card.status,
        ...updateCardDto.status,
      };
    }
    if (updateCardDto.reward) {
      res[card.id].reward = {
        ...card.reward,
        ...updateCardDto.reward,
        chain: {
          ...card.reward.chain,
          ...updateCardDto.reward?.chain,
        },
        token: {
          ...card.reward.token,
          ...updateCardDto.reward?.token,
        },
      };
    }

    return res;
  }

  getUpdatedProject(
    card: Card,
    project: Project,
    updateCardDto: UpdateCardRequestDto,
  ): MappedPartialItem<Project> {
    if (
      (updateCardDto.columnId && updateCardDto.columnId !== card.columnId) ||
      typeof updateCardDto.cardIndex === 'number' // Must do it this way so we support 0 index
    ) {
      return this.cardsProjectService.reorderCard(
        project,
        card.id || card._id.toString(),
        {
          destinationColumnId: updateCardDto.columnId
            ? updateCardDto.columnId
            : card.columnId,
          destinationCardIndex: updateCardDto.cardIndex
            ? updateCardDto.cardIndex
            : 0,
        } as ReorderCardReqestDto,
      );
    }

    return {};
  }

  distinctifyArrayFields(
    updateCardDto: UpdateCardRequestDto,
  ): UpdateCardRequestDto {
    if (updateCardDto.assignee)
      updateCardDto.assignee = this.commonTools.distinctifyArray(
        updateCardDto.assignee,
      );
    if (updateCardDto.reviewer)
      updateCardDto.reviewer = this.commonTools.distinctifyArray(
        updateCardDto.reviewer,
      );
    if (updateCardDto.labels)
      updateCardDto.labels = this.commonTools.distinctifyArray(
        updateCardDto.labels,
      );

    return updateCardDto;
  }
}

@CommandHandler(UpdateMultipleCardsCommand)
export class UpdateMultipleCardsCommandHandler
  implements ICommandHandler<UpdateMultipleCardsCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly commonTools: CommonTools,
    private readonly cardsService: CardsService,
    private readonly commonUpdateService: CommonUpdateService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateMultipleCardsCommandHandler');
  }

  async execute(
    command: UpdateMultipleCardsCommand,
  ): Promise<MappedItem<DetailedCardResponseDto> | boolean> {
    try {
      const { cardIds, cards, caller, mappedUpdateDto, commonUpdateDto } =
        command;
      if (!cardIds && !cards)
        throw `Card Ids and cards both cannot be null or undefined`;
      const cardsToUpdate =
        cards ||
        (await this.cardsRepository.findAll({
          _id: cardIds,
        }));
      console.log(cardsToUpdate);
      const projectIds = cardsToUpdate.map((a) => a.project);
      const circleIds = cardsToUpdate.map((a) => a.circle);
      console.log(projectIds);
      const projects = await this.queryBus.execute(
        new GetMultipleProjectsQuery({
          _id: projectIds,
        }),
      );
      const circles = await this.queryBus.execute(
        new GetMultipleCirclesQuery({ _id: circleIds }),
      );
      const mappedProjects = this.generateCardIdToItemMap(
        cardsToUpdate,
        projects,
        'project',
      );
      const mappedCircles = this.generateCardIdToItemMap(
        cardsToUpdate,
        circles,
        'circle',
      );

      let cardUpdates = {};
      let projectUpdates = {};

      for (const card of cardsToUpdate) {
        const multipleItemContainer: MultipleItemContainer =
          await this.commandBus.execute(
            new UpdateCardCommand(
              mappedUpdateDto[card.id] || commonUpdateDto || {},
              mappedProjects[card.id] as Project,
              mappedCircles[card.id] as Circle,
              caller,
              card,
              false,
            ),
          );
        cardUpdates = this.cardsService.merge(
          cardUpdates,
          multipleItemContainer.cards,
        );
        projectUpdates = this.cardsService.merge(
          projectUpdates,
          multipleItemContainer.projects,
        );
      }
      await this.commonUpdateService.execute(cardUpdates, projectUpdates);

      const cardIdsToFetch = Object.keys(cardUpdates).filter(
        (cId) => !cardsToUpdate.hasOwnProperty(cId),
      );
      const allUpdatedCards = await this.queryBus.execute(
        new GetMultipleCardsByIdsQuery(cardIdsToFetch),
      );
      for (const card of allUpdatedCards) {
        const diff = this.cardsService.getDifference(card, cardUpdates);

        this.eventBus.publish(
          new CardUpdatedEvent(
            card,
            diff,
            mappedCircles[card.id].slug,
            mappedProjects[card.id].slug,
            caller,
          ),
        );
      }

      return true;
    } catch (error) {
      console.log(error);
      this.logger.error(error.message);
      throw new InternalServerErrorException(error);
    }
  }

  generateCardIdToItemMap(
    cards: Card[],
    items: Project[] | Circle[],
    type: 'project' | 'circle',
  ): MappedItem<Project | Circle> {
    const mappedItem = this.commonTools.objectify(items, 'id');
    const cardIdToItem = {};
    for (const card of cards) {
      if (type === 'project') cardIdToItem[card.id] = mappedItem[card.project];
      else if (type === 'circle')
        cardIdToItem[card.id] = mappedItem[card.circle];
    }
    return cardIdToItem;
  }
}

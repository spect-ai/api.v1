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
} from '@nestjs/cqrs';
import { PerformMultipleAutomationsCommand } from 'src/automation/commands/impl';
import { MultipleItemContainer } from 'src/automation/types/types';
import { CardsRepository } from 'src/card/cards.repository';
import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { CardUpdatedEvent } from 'src/card/events/impl';
import { Card } from 'src/card/model/card.model';
import { ActivityBuilder } from 'src/card/services/activity-builder.service';
import { CardsService } from 'src/card/services/cards.service';
import { CommonUpdateService } from 'src/card/services/common-update.service';
import { ResponseBuilder } from 'src/card/services/response.service';
import { CommonTools } from 'src/common/common.service';
import { MappedPartialItem } from 'src/common/interfaces';
import { CardsProjectService } from 'src/project/cards.project.service';
import { ReorderCardReqestDto } from 'src/project/dto/reorder-card-request.dto';
import { Project } from 'src/project/model/project.model';
import { UpdateCardCommand } from '../impl/update-card.command';
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
    private readonly responseBuilder: ResponseBuilder,
    private readonly cardsService: CardsService,
    private readonly commonUpdateService: CommonUpdateService,
    private readonly activityBuilder: ActivityBuilder,
  ) {}

  async execute(command: UpdateCardCommand): Promise<DetailedCardResponseDto> {
    try {
      const { updateCardDto, card, project, circle, caller } = command;

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
      );
      updatedProject = this.cardsService.merge(
        updatedProject,
        multipleItemContainer.projects,
      );
      console.log(updatedCard);
      const diff = this.cardsService.getDifference(card, updatedCard);
      await this.commonUpdateService.execute(updatedCard, updatedProject);
      const resultingCard =
        await this.cardsRepository.getCardWithPopulatedReferences(card.id);

      this.eventBus.publish(
        new CardUpdatedEvent(
          resultingCard,
          diff,
          circle.slug,
          project.slug,
          caller,
        ),
      );
      return this.responseBuilder.enrichResponse(resultingCard);
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
      updateCardDto.cardIndex
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
}

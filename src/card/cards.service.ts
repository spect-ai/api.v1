import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CardsProjectService } from 'src/project/cards.project.service';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { Project } from 'src/project/model/project.model';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import { Card } from './model/card.model';
import { ResponseBuilder } from './response.builder';
import { Diff, MappedCard } from './types/types';
import { CardValidationService } from './validation.cards.service';
import { CommonTools } from 'src/common/common.service';
import { Circle } from 'src/circle/model/circle.model';

@Injectable()
export class CardsService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly circleRepository: CirclesRepository,
    private readonly projectService: ProjectService,
    private readonly cardsProjectService: CardsProjectService,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
    private readonly commonTools: CommonTools,
  ) {}

  getDifference(card: Card, request: UpdateCardRequestDto): Diff {
    const filteredCard = {};
    const filteredCardArrayFields = {};
    const filteredRequest = {};

    for (const key in request) {
      if (Array.isArray(card[key])) filteredCardArrayFields[key] = card[key];
      else {
        filteredCard[key] = card[key];
        filteredRequest[key] = request[key];
      }
    }

    const objDiff = this.commonTools.findDifference(
      filteredCard,
      filteredRequest,
    ) as Diff;
    const arrayDiff = {};
    for (const key in filteredCardArrayFields) {
      arrayDiff[key] = this.commonTools.findDifference(
        filteredCardArrayFields[key],
        request[key],
      );
      if (arrayDiff[key]['added'].length > 0) {
        objDiff['added'] = {
          ...objDiff['added'],
          [key]: arrayDiff[key]['added'],
        };
      }
      if (arrayDiff[key]['removed'].length > 0) {
        objDiff['deleted'] = {
          ...objDiff['deleted'],
          [key]: arrayDiff[key]['removed'],
        };
      }
    }
    return objDiff;
  }

  async getDetailedCard(id: string): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.getCardWithPopulatedReferences(
        id,
      );
      return card;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card retrieval',
        error.message,
      );
    }
  }

  async getDetailedCardByProjectSlugAndCardSlug(
    projectSlug: string,
    cardSlug: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      const project = await this.projectService.getProjectIdFromSlug(
        projectSlug,
      );
      return await this.getDetailedCardByProjectIdAndCardSlug(
        project.id,
        cardSlug,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card retrieval',
        error.message,
      );
    }
  }

  async getDetailedCardByProjectIdAndCardSlug(
    project: string,
    slug: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card =
        await this.cardsRepository.getCardWithPopulatedReferencesBySlug(
          project,
          slug,
        );
      return await this.responseBuilder.enrichResponse(card);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed card retrieval',
        error.message,
      );
    }
  }

  createNew(
    createCardDto: CreateCardRequestDto,
    projectSlug: string,
    slugNum: number,
  ): Partial<Card> {
    createCardDto.type = createCardDto.type || 'Task';
    const activity = this.activityBuilder.buildNewCardActivity(createCardDto);

    return {
      ...createCardDto,
      slug: `${projectSlug}-${slugNum.toString()}`,
      activity: [activity],
      creator: this.requestProvider.user.id,
    };
  }

  addChildCards(
    createCardDto: CreateCardRequestDto,
    parentCard: Card,
    circle: Circle,
    projectSlug: string,
    startSlugNum: number,
  ): Card[] {
    const childCards = createCardDto.childCards;
    if (!childCards || childCards.length === 0) return [];

    let slugNum = startSlugNum;
    const cards = [];
    for (const childCard of childCards) {
      createCardDto.type = createCardDto.type || 'Task';
      const activity = this.activityBuilder.buildNewCardActivity(createCardDto);

      cards.push({
        ...childCard,
        project: childCard.project || createCardDto.project,
        circle: childCard.circle || circle.id,
        parent: parentCard.id,
        reward: createCardDto.reward || { ...circle.defaultPayment, value: 0 }, //TODO: add reward to child cards
        columnId: childCard.columnId || createCardDto.columnId,
        activity: [activity],
        slug: `${projectSlug}-${slugNum.toString()}`,
      });
      slugNum++;
    }
    return cards;
  }

  async addToParentCard(
    cards: Card[] | Card,
    parentCard: Card,
  ): Promise<MappedCard> {
    if (!parentCard) return {};
    if (!Array.isArray(cards)) cards = [cards];
    const cardIds = cards.map((card) => card.id);
    return {
      [parentCard.id]: {
        children: [...parentCard.children, ...cardIds],
      },
    };
  }

  update(
    card: Card,
    project: Project,
    updateCardDto: UpdateCardRequestDto,
  ): MappedCard {
    try {
      const activities = this.activityBuilder.buildUpdatedCardActivity(
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
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed card update',
        error.message,
      );
    }
  }

  async archive(id: string): Promise<DetailedProjectResponseDto> {
    const card = await this.cardsRepository.getCardWithAllChildren(id);
    this.validationService.validateCardExists(card);
    const cardIds = [
      ...card.flattenedChildren.map((c) => c._id.toString()),
      id,
    ] as string[];

    const updatedProject =
      await this.cardsProjectService.removeMultipleCardsFromProject(
        card.project.toString(),
        cardIds,
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
    if (!updateAcknowledgment.acknowledged) {
      throw new HttpException(
        'Something went wrong while updating payment info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return updatedProject;
  }

  async revertArchive(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    this.validationService.validateCardExists(card);

    if (!card.status.archived)
      throw new HttpException(
        'Card is not in archived state',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const updatedProject = await this.cardsProjectService.addCardToProject(
      card.project as string,
      card.columnId,
      card.id,
    );
    return await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
      id,
      {
        'status.archived': false,
        'status.active': true,
      },
    );
  }
}

import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
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
import { MappedCard } from './types/types';
import { CardValidationService } from './validation.cards.service';

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
  ) {}

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

  private async createOneCard(
    createCardDto: CreateCardRequestDto,
    slug?: string,
  ): Promise<{
    card: Card;
    project: DetailedProjectResponseDto;
  }> {
    if (!this.requestProvider.project)
      throw new HttpException('No project found', HttpStatus.NOT_FOUND);
    if (!createCardDto.type) createCardDto.type = 'Task';
    const activity = this.activityBuilder.buildNewCardActivity(createCardDto);

    if (!slug) {
      const cardNum = await this.cardsRepository.count({
        project: createCardDto.project,
      });
      /** Card slugs need to be globally unique so they can be moved between projects. Since
       * project slug is already unique, we can use it to create a unique slug for each card. */
      slug = `${this.requestProvider.project.slug}-${cardNum.toString()}`;
    }

    const createdCard = (await this.cardsRepository.create({
      ...createCardDto,
      activity: [activity],
      slug,
      creator: this.requestProvider.user.id,
    })) as Card;

    /** Add the card to the project column */
    const project = await this.cardsProjectService.addCardToProject(
      createCardDto.project,
      createCardDto.columnId,
      createdCard.id,
    );

    return {
      card: createdCard,
      project: project,
    };
  }

  async create(createCardDto: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
    project: DetailedProjectResponseDto;
    parentCard?: DetailedCardResponseDto;
  }> {
    try {
      const res = await this.createOneCard(createCardDto);
      let createdCard = res.card;
      let project = res.project;

      /** If card has a parent, add the card as a child in the parent card */
      let updatedParentCard: Card;
      if (createdCard.parent) {
        /** Find the parent card to be able to append children to contain current card. */
        const parentCard =
          await this.cardsRepository.getCardWithUnpopulatedReferences(
            createdCard.parent,
          );
        this.validationService.validateCardExists(parentCard);
        updatedParentCard =
          await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
            parentCard.id,
            {
              children: [...parentCard.children, createdCard.id],
            },
          );
      }
      /** If card has children add the child cards first and then update the parent card to reference the children */
      if (createCardDto.childCards?.length > 0) {
        /** Adding the child cards */
        const resCreateMultipleCards = await this.createMultipleCards(
          createCardDto.childCards,
          createdCard.project as string,
          createdCard.circle,
          createdCard.columnId,
          parseInt(createdCard.slug) + 1,
          createdCard.id,
        );
        project = resCreateMultipleCards.project;
        /** Update the parent card with the children */
        createdCard =
          await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
            createdCard.id,
            {
              children: createdCard.children.concat(
                resCreateMultipleCards.cardIds,
              ),
            },
          );
      }

      return {
        project: project,
        card: createdCard,
        parentCard: updatedParentCard,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card creation',
        error.message,
      );
    }
  }

  async createMultipleCards(
    createCardDtos: CreateCardRequestDto[],
    project: string,
    circleId: string,
    columnId?: string,
    numCards?: number,
    parent?: string,
  ): Promise<{
    cardIds: string[];
    project: DetailedProjectResponseDto;
  }> {
    try {
      const circle = await this.circleRepository.getCircle(circleId);
      const defaultReward = { ...circle.defaultPayment, value: 0 };
      /** Add the project, column and circle for cards, dont create card in this loop in case there's a failure.
       * We want to prevent a scenario where some cards are created and others are not. */
      for (const createCardDto of createCardDtos) {
        createCardDto.project = project;
        createCardDto.circle = circleId;
        createCardDto.parent = parent;
        if (!createCardDto.reward) createCardDto.reward = defaultReward;
        if (!createCardDto.columnId && columnId) {
          createCardDto.columnId = columnId;
        }
        if (!createCardDto.columnId) {
          throw new HttpException(
            'Column Id must be entered',
            HttpStatus.NOT_FOUND,
          );
        }
      }

      /** Set the number of cards that exists presently in the project */
      if (!numCards) {
        numCards = await this.cardsRepository.count({
          project: project,
        });
      }
      /** Create the card */
      const newCardIds = [] as string[];
      let res;
      for (const [index, createCardDto] of createCardDtos.entries()) {
        /** Card slugs need to be globally unique so they can be moved between projects. Since
         * project slug is already unique, we can use it to create a unique slug for each card. */
        res = await this.createOneCard(
          createCardDto,
          `${this.requestProvider.project.slug}-${(
            numCards + index
          ).toString()}`,
        );
        newCardIds.push(res.card.id);
      }

      return {
        cardIds: newCardIds,
        project:
          'project' in res
            ? (res.project as DetailedProjectResponseDto)
            : ({} as DetailedProjectResponseDto),
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed multiple card creation',
        error.message,
      );
    }
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

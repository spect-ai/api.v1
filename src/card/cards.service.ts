import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from 'src/project/dto/reorder-card-request.dto';
import { Project } from 'src/project/model/project.model';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { AggregatedFlattenedPaymentInfo } from './dto/payment-info-response.dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import { UpdatePaymentInfoDto } from './dto/update-payment-info.dto';
import { Card } from './model/card.model';
import { ResponseBuilder } from './response.builder';
import { CardValidationService } from './validation.cards.service';

@Injectable()
export class CardsService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly circleRepository: CirclesRepository,
    private readonly projectService: ProjectService,
    private readonly datastructureManipulationService: DataStructureManipulationService,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
  ) {}

  private async createOneCard(
    createCardDto: CreateCardRequestDto,
    slug?: string,
  ): Promise<{
    card: Card;
    project: DetailedProjectResponseDto;
  }> {
    const activity = this.activityBuilder.buildNewCardActivity(createCardDto);

    if (!slug) {
      const cardNum = await this.cardsRepository.count({
        project: createCardDto.project,
      });
      slug = cardNum.toString();
    }

    const createdCard = (await this.cardsRepository.create({
      ...createCardDto,
      activity: [activity],
      slug,
      creator: this.requestProvider.user.id,
    })) as Card;

    /** Add the card to the project column */
    const project = await this.projectService.addCardToProject(
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
          createdCard.project,
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
        res = await this.createOneCard(
          createCardDto,
          (numCards + index).toString(),
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

  async update(
    id: string,
    updateCardDto: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id).populate('project');
      const project = card.project as unknown as Project;
      if (updateCardDto.columnId) {
        if (card.columnId !== updateCardDto.columnId) {
          await this.projectService.reorderCard(
            project.id,
            id,
            {
              destinationColumnId: updateCardDto.columnId,
              destinationCardIndex: 0,
            } as ReorderCardReqestDto,
            false,
          );
        }
      }
      const activities = this.activityBuilder.buildUpdatedCardActivity(
        updateCardDto,
        card,
        project,
      );

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            ...updateCardDto,
            activity: card.activity.concat(activities),
          },
        );
      return await this.responseBuilder.enrichResponse(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card update',
        error.message,
      );
    }
  }

  getDividedRewards(value: number, members: string[]) {
    const rewardValues = [];
    for (let i = 0; i < members.length; i++) {
      // Distribution streategy => First assignee receives the entire amount. Can be customized in the future
      if (i === 0) {
        rewardValues.push(value);
      } else {
        rewardValues.push(0);
      }
    }
    return rewardValues;
  }

  async aggregatePaymentInfo(
    cardIds: string[],
    chainId: string,
  ): Promise<AggregatedFlattenedPaymentInfo> {
    const cards = await this.cardsRepository.findAll({
      _id: { $in: cardIds },
      'reward.chain.chainId': chainId,
    });
    const aggregatedPaymentInfo = {
      approval: { tokenAddresses: [], values: [] },
      currency: { userIds: [], values: [] },
      tokens: { tokenAddresses: [], userIds: [], values: [] },
    } as AggregatedFlattenedPaymentInfo;

    /*
     * Aggregate the reward values and group them by token address to get the minimum amount
     * that needs to be approved by user to be able to make payment
     */
    let aggregatedRewardValuesGroupedByToken = {};
    for (const card of cards) {
      if (card.reward.token.address !== '0x0')
        aggregatedRewardValuesGroupedByToken =
          this.datastructureManipulationService.setOrAggregateObjectKey(
            aggregatedRewardValuesGroupedByToken,
            card.reward.token.address,
            card.reward.value,
          );
    }
    aggregatedPaymentInfo.approval.tokenAddresses = Object.keys(
      aggregatedRewardValuesGroupedByToken,
    );
    aggregatedPaymentInfo.approval.values = Object.values(
      aggregatedRewardValuesGroupedByToken,
    );

    /*
     * Aggregate the reward values and group them by token address and assignee to get the reward share
     * each assignee gets
     */
    const paymentInfo = {};
    for (const card of cards) {
      const assignees = card.assignee;
      const reward = card.reward;
      if (reward.value > 0 && assignees.length > 0) {
        const rewardValues = this.getDividedRewards(reward.value, assignees);

        for (const [index, assignee] of assignees.entries()) {
          if (!paymentInfo.hasOwnProperty(reward.token.address)) {
            paymentInfo[reward.token.address] = {};
          }
          paymentInfo[reward.token.address] =
            this.datastructureManipulationService.setOrAggregateObjectKey(
              paymentInfo[reward.token.address],
              assignee,
              rewardValues[index],
            );
        }
      }
    }

    /*
     * Flatten the reward tokens, users and values into equal length arrays
     */
    for (const [tokenAddress, userIdToValue] of Object.entries(paymentInfo)) {
      if (tokenAddress === '0x0') {
        aggregatedPaymentInfo.currency.userIds = Object.keys(userIdToValue);
        aggregatedPaymentInfo.currency.values = Object.values(userIdToValue);
      } else {
        for (const [userId, value] of Object.entries(userIdToValue)) {
          aggregatedPaymentInfo.tokens.tokenAddresses.push(tokenAddress);
          aggregatedPaymentInfo.tokens.userIds.push(userId);
          aggregatedPaymentInfo.tokens.values.push(value);
        }
      }
    }

    return aggregatedPaymentInfo;
  }

  async updatePaymentInfoAndClose(
    updatePaymentInfo: UpdatePaymentInfoDto,
  ): Promise<any> {
    try {
      if (updatePaymentInfo.cardIds.length === 0) {
        throw new HttpException(
          'Card ids cannot be empty',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      /** Taking the first card to get the project */
      const card = await this.cardsRepository.getCardWithPopulatedReferences(
        updatePaymentInfo.cardIds[0],
      );
      const project = card.project as unknown as Project;
      const activities = this.activityBuilder.buildUpdatedCardActivity(
        {
          status: {
            active: false,
            paid: true,
            archived: false,
          },
        },
        card,
        project,
      );

      /** Mongo only returns an acknowledgment on update and not the updated records itself */
      const updateAcknowledgment = await this.cardsRepository.updateMany(
        {
          _id: { $in: updatePaymentInfo.cardIds },
        },
        {
          $set: {
            'reward.transactionHash': updatePaymentInfo.transactionHash,
            'status.active': false,
            'status.paid': true,
          },
          $push: {
            activity: activities[0],
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
      return await this.projectService.getDetailedProject(project.id);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating payment info',
        error.message,
      );
    }
  }

  async archive(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    this.validationService.validateCardExists(card);
    const childCards = await this.cardsRepository.getCardWithAllChildren(
      card.project,
      id,
    );
    const updatedProject = await this.projectService.removeCardFromProject(
      card.project.toString(),
      id,
    );

    return await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
      id,
      {
        'status.archived': true,
        'status.active': false,
      },
    );
  }

  async revertArchive(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    this.validationService.validateCardExists(card);

    if (!card.status.archived)
      throw new HttpException(
        'Card is not in archived state',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const updatedProject = await this.projectService.addCardToProject(
      card.project,
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

  async delete(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    this.validationService.validateCardExists(card);

    return await this.cardsRepository.deleteById(id);
  }
}

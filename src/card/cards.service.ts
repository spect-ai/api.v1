import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CirclesRepository } from 'src/circle/circles.repository';
import { ActivityBuilder } from 'src/card/activity.builder';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from 'src/project/dto/reorder-card-request.dto';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import { Card } from './model/card.model';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  CreateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from './dto/work-request.dto';
import { Activity } from 'src/common/types/activity.type';
import { AddCommentDto, UpdateCommentDto } from './dto/comment-body.dto';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { AggregatedFlattenedPaymentInfo } from './dto/payment-info-response.dto';
import { UpdatePaymentInfoDto } from './dto/update-payment-info.dto';
import { ActivityResolver } from './activity.resolver';
import { Project } from 'src/project/model/project.model';

@Injectable()
export class CardsService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly activityResolver: ActivityResolver,
    private readonly circleRepository: CirclesRepository,
    private readonly projectService: ProjectService,
    private readonly datastructureManipulationService: DataStructureManipulationService,
  ) {}

  validateCardExists(card: Card) {
    if (!card) {
      throw new HttpException('Card not found', HttpStatus.NOT_FOUND);
    }
  }

  validateCardThreadExists(card: Card, threadId: string) {
    if (!card.workThreads[threadId]) {
      throw new HttpException('Work thread not found', HttpStatus.NOT_FOUND);
    }
  }

  validateComment(card: Card, commentIndex: number) {
    if (commentIndex === -1) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
    if (card.activity[commentIndex].actorId !== this.requestProvider.user.id) {
      throw new HttpException(
        'You are not authorized to update this comment',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!card.activity[commentIndex].comment) {
      throw new HttpException('Not a comment', HttpStatus.NOT_FOUND);
    }
  }

  async enrichActivity(card: Card) {
    card = await this.activityResolver.resolveActivities(card);
    card.activity = card.activity.reverse();
    return card;
  }

  async create(createCardDto: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
    project: DetailedProjectResponseDto;
  }> {
    try {
      const activity = this.activityBuilder.buildNewCardActivity(createCardDto);
      // const defaultPayment = await this.circleRepository.getDefaultPayment(
      //   createCardDto.circle,
      // );
      // bug, we can send reward in create card, default payment value = 0
      const cardNum = await this.cardsRepository.count({
        project: createCardDto.project,
      });

      const card = await this.cardsRepository.create({
        ...createCardDto,
        activity: [activity],
        slug: cardNum.toString(),
        creator: this.requestProvider.user.id,
      });
      const project = await this.projectService.addCardToProject(
        createCardDto.project,
        createCardDto.columnId,
        card._id,
      );
      return {
        project: project,
        card: card,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card creation',
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
      return await this.enrichActivity(card);
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
            project._id.toString(),
            id,
            {
              destinationColumnId: updateCardDto.columnId,
              destinationCardIndex: 'end',
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

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          ...updateCardDto,
          activity: card.activity.concat(activities),
        })
        .populate('project')
        .populate('circle');
      return await this.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card update',
        error.message,
      );
    }
  }

  async createWorkThread(
    id: string,
    createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validateCardExists(card);

      const workUnitId = uuidv4();
      const workUnit = {};
      workUnit[workUnitId] = {
        user: this.requestProvider.user._id,
        content: createWorkThread.content,
        workUnitId,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'submission',
      };

      const threadId = uuidv4();
      const workThreads = {
        ...card.workThreads,
        [threadId]: {
          threadId,
          name: createWorkThread.name,
          workUnitOrder: [workUnitId],
          workUnits: workUnit,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: createWorkThread.status,
        },
      };
      const workThreadOrder = [...card.workThreadOrder, threadId];

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          workThreads,
          workThreadOrder,
        })
        .populate('project')
        .populate('circle');
      return this.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work thread',
        error.message,
      );
    }
  }

  async updateWorkThread(
    id: string,
    threadId: string,
    updateWorkThread: UpdateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validateCardExists(card);
      this.validateCardThreadExists(card, threadId);

      card.workThreads[threadId] = {
        ...card.workThreads[threadId],
        ...updateWorkThread,
        updatedAt: new Date(),
      };

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          workThreads: card.workThreads,
        })
        .populate('project')
        .populate('circle');

      return await this.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating work thread',
        error.message,
      );
    }
  }

  async createWorkUnit(
    id: string,
    threadId: string,
    createWorkUnit: CreateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validateCardExists(card);
      this.validateCardThreadExists(card, threadId);

      const workUnitId = uuidv4();
      const workUnits = {
        ...card.workThreads[threadId].workUnits,
        [workUnitId]: {
          unitId: workUnitId,
          user: this.requestProvider.user._id,
          content: createWorkUnit.content,
          workUnitId,
          createdAt: new Date(),
          updatedAt: new Date(),
          type: createWorkUnit.type,
        },
      };
      card.workThreads[threadId] = {
        ...card.workThreads[threadId],
        workUnitOrder: [
          ...card.workThreads[threadId].workUnitOrder,
          workUnitId,
        ],
        workUnits,
        status: createWorkUnit.status || card.workThreads[threadId].status,
        updatedAt: new Date(),
      };

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          workThreads: card.workThreads,
        })
        .populate('project')
        .populate('circle');

      return await this.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work unit',
        error.message,
      );
    }
  }

  async udpateWorkUnit(
    id: string,
    threadId: string,
    workUnitId: string,
    updateWorkUnit: UpdateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validateCardExists(card);
      this.validateCardThreadExists(card, threadId);

      card.workThreads[threadId].workUnits[workUnitId] = {
        ...card.workThreads[threadId].workUnits[workUnitId],
        content: updateWorkUnit.content,
        type: updateWorkUnit.type,
        updatedAt: new Date(),
      };

      card.workThreads[threadId] = {
        ...card.workThreads[threadId],
        status: updateWorkUnit.status || card.workThreads[threadId].status,
        updatedAt: new Date(),
      };

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          workThreads: card.workThreads,
        })
        .populate('project')
        .populate('circle');

      return await this.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating work unit',
        error.message,
      );
    }
  }

  async addComment(
    id: string,
    addCommentDto: AddCommentDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validateCardExists(card);

      const commitId = uuidv4();
      card.activity = [
        ...card.activity,
        {
          commitId,
          actorId: this.requestProvider.user.id,
          content: addCommentDto.comment,
          timestamp: new Date(),
          comment: true,
        } as Activity,
      ];

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          activity: card.activity,
        })
        .populate('project')
        .populate('circle');
      return await this.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed adding comment',
        error.message,
      );
    }
  }

  async updateComment(
    id: string,
    commitId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validateCardExists(card);

      const commentIndex = card.activity.findIndex((activity) => {
        return activity.commitId === commitId;
      });
      this.validateComment(card, commentIndex);

      card.activity[commentIndex].content = updateCommentDto.comment;

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          activity: card.activity,
        })
        .populate('project')
        .populate('circle');
      return await this.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating comment',
        error.message,
      );
    }
  }

  async deleteComment(
    id: string,
    commitId: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validateCardExists(card);

      const commentIndex = card.activity.findIndex((activity) => {
        return activity.commitId === commitId;
      });
      this.validateComment(card, commentIndex);

      card.activity.splice(commentIndex, 1);

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          activity: card.activity,
        })
        .populate('project')
        .populate('circle');
      return await this.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed adding comment',
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
      return await this.projectService.getDetailedProject(
        project._id.toString(),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating payment info',
        error.message,
      );
    }
  }

  async archive(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    this.validateCardExists(card);
    const updatedProject = await this.projectService.removeCardFromProject(
      card.project.toString(),
      id,
    );
    return await this.cardsRepository.updateById(id, {
      'status.archived': true,
      'status.active': false,
    });
  }

  async revertArchive(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    this.validateCardExists(card);

    if (!card.status.archived)
      throw new HttpException(
        'Card is not in archived state',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const updatedProject = await this.projectService.addCardToProject(
      card.project,
      card.columnId,
      card._id,
    );
    return await this.cardsRepository.updateById(id, {
      'status.archived': false,
      'status.active': true,
    });
  }

  async delete(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    this.validateCardExists(card);

    return await this.cardsRepository.deleteById(id);
  }
}

import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CirclesRepository } from 'src/circle/circles.repository';
import { ActivityBuilder } from 'src/common/activity.builder';
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

@Injectable()
export class CardsService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly circleRepository: CirclesRepository,
    private readonly projectService: ProjectService,
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

  reverseActivity(card: Card) {
    card.activity = card.activity.reverse();
    return card;
  }

  async create(createCardDto: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
    project: DetailedProjectResponseDto;
  }> {
    try {
      const activity = this.activityBuilder.getActivity(
        this.requestProvider,
        createCardDto,
        null,
      );
      const defaultPayment = await this.circleRepository.getDefaultPayment(
        createCardDto.circle,
      );
      const cardNum = await this.cardsRepository.count({
        project: createCardDto.project,
      });

      const card = await this.cardsRepository.create({
        ...createCardDto,
        activity: activity,
        reward: defaultPayment,
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

  async getDetailedCardBySlug(
    project: string,
    slug: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      return await this.cardsRepository.getCardWithPopulatedReferencesBySlug(
        project,
        slug,
      );
    } catch (error) {
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
      if (updateCardDto.columnId) {
        const card = await this.cardsRepository.findById(id);

        if (card.columnId !== updateCardDto.columnId) {
          await this.projectService.reorderCard(
            card.project.toString(),
            id,
            {
              destinationColumnId: updateCardDto.columnId,
              destinationCardIndex: 'end',
            } as ReorderCardReqestDto,
            false,
          );
        }
      }

      const updatedCard = await this.cardsRepository.updateById(
        id,
        updateCardDto,
      );
      return this.reverseActivity(updatedCard);
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
          workUnitOrder: [workUnitId],
          workUnits: workUnit,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: createWorkThread.status,
        },
      };
      const workThreadOrder = [...card.workThreadOrder, threadId];

      const updatedCard = await this.cardsRepository.updateById(id, {
        workThreads,
        workThreadOrder,
      });
      return updatedCard;
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

      const updatedCard = await this.cardsRepository.updateById(id, {
        workThreads: card.workThreads,
      });

      return updatedCard;
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

      const updatedCard = await this.cardsRepository.updateById(id, {
        workThreads: card.workThreads,
      });

      return updatedCard;
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

      const updatedCard = await this.cardsRepository.updateById(id, {
        workThreads: card.workThreads,
      });

      return updatedCard;
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

      const updatedCard = await this.cardsRepository.updateById(id, {
        activity: card.activity,
      });
      return this.reverseActivity(updatedCard);
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

      const updatedCard = await this.cardsRepository.updateById(id, {
        activity: card.activity,
      });
      return this.reverseActivity(updatedCard);
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

      const updatedCard = await this.cardsRepository.updateById(id, {
        activity: card.activity,
      });
      return this.reverseActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed adding comment',
        error.message,
      );
    }
  }

  async delete(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    this.validateCardExists(card);

    return await this.cardsRepository.deleteById(id);
  }
}

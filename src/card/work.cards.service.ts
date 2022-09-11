import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RequestProvider } from 'src/users/user.provider';
import { v4 as uuidv4 } from 'uuid';
import { ActivityBuilder } from './services/activity-builder.service';
import {
  CreateGithubPRDto,
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from './dto/work-request.dto';
import { Card } from './model/card.model';
import { MappedCard } from './types/types';
import { EventBus } from '@nestjs/cqrs';

@Injectable()
export class WorkService {
  constructor(
    private readonly activityBuilder: ActivityBuilder,
    private readonly requestProvider: RequestProvider,
    private readonly eventBus: EventBus,
  ) {}

  async createSameWorkThreadInMultipleCards(
    cards: Card[],
    createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<MappedCard> {
    try {
      let threads = {};
      for (const cardId of cards) {
        const thread = await this.createWorkThread(cardId, createWorkThread);
        threads = { ...threads, ...thread };
      }
      return threads;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work thread',
        error.message,
      );
    }
  }

  async createWorkThread(
    card: Card,
    createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<MappedCard> {
    try {
      const workUnitId = uuidv4();
      const workUnit = {};

      workUnit[workUnitId] = {
        user: this.requestProvider.user?.id,
        content: createWorkThread.content || '',
        workUnitId,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'submission',
        pr: createWorkThread.pr,
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

      const activity = this.activityBuilder.buildCreateWorkActivity(
        this.requestProvider.user.id,
        'createWorkUnit',
        createWorkThread.name,
        createWorkThread.content,
        'submission',
      );
      return {
        [card.id]: {
          workThreads,
          workThreadOrder,
          activity: activity ? [...card.activity, activity] : card.activity,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work thread',
        error.message,
      );
    }
  }
}

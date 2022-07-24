import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RequestProvider } from 'src/users/user.provider';
import { v4 as uuidv4 } from 'uuid';
import { ActivityBuilder } from './activity.builder';
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
        user: this.requestProvider.user.id,
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

  async updateWorkThread(
    card: Card,
    threadId: string,
    updateWorkThread: UpdateWorkThreadRequestDto,
  ): Promise<MappedCard> {
    try {
      const workThreads = {
        ...card.workThreads,
        [threadId]: {
          ...card.workThreads[threadId],
          name: updateWorkThread.name || card.workThreads[threadId].name,
          active: updateWorkThread.active || card.workThreads[threadId].active,
          status: updateWorkThread.status || card.workThreads[threadId].status,
          updatedAt: new Date(),
        },
      };
      const activity = this.activityBuilder.buildUpdateWorkThreadActivity(
        card,
        threadId,
        updateWorkThread,
      );

      return {
        [card.id]: {
          workThreads: workThreads,
          activity: activity ? [...card.activity, activity] : card.activity,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating work thread',
        error.message,
      );
    }
  }

  async createWorkUnit(
    card: Card,
    threadId: string,
    createWorkUnit: CreateWorkUnitRequestDto,
  ): Promise<MappedCard> {
    try {
      const workUnitId = uuidv4();
      const workUnits = {
        ...card.workThreads[threadId].workUnits,
        [workUnitId]: {
          unitId: workUnitId,
          user: this.requestProvider.user.id,
          content: createWorkUnit.content || '',
          workUnitId,
          createdAt: new Date(),
          updatedAt: new Date(),
          type: createWorkUnit.type,
          pr: createWorkUnit.pr,
        },
      };
      const workThreads = {
        ...card.workThreads,
        [threadId]: {
          ...card.workThreads[threadId],
          workUnitOrder: [
            ...card.workThreads[threadId].workUnitOrder,
            workUnitId,
          ],
          status: createWorkUnit.status || card.workThreads[threadId].status,
          workUnits: workUnits,
          updatedAt: new Date(),
        },
      };
      const activity = this.activityBuilder.buildCreateWorkActivity(
        'createWorkUnit',
        card.workThreads[threadId].name,
        createWorkUnit.content,
        createWorkUnit.type,
      );

      return {
        [card.id]: {
          workThreads: workThreads,
          activity: activity ? [...card.activity, activity] : card.activity,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work unit',
        error.message,
      );
    }
  }

  async updateWorkUnit(
    card: Card,
    threadId: string,
    workUnitId: string,
    updateWorkUnit: UpdateWorkUnitRequestDto,
  ): Promise<MappedCard> {
    try {
      card.workThreads[threadId].workUnits[workUnitId] = {
        ...card.workThreads[threadId].workUnits[workUnitId],
        content:
          updateWorkUnit.content ||
          card.workThreads[threadId].workUnits[workUnitId].content ||
          '',
        type:
          updateWorkUnit.type ||
          card.workThreads[threadId].workUnits[workUnitId].type,
        pr:
          updateWorkUnit.pr ||
          card.workThreads[threadId].workUnits[workUnitId].pr,
        updatedAt: new Date(),
      };

      const workThreads = {
        ...card.workThreads,
        [threadId]: {
          ...card.workThreads[threadId],
          status: updateWorkUnit.status || card.workThreads[threadId].status,
          updatedAt: new Date(),
        },
      };

      const activity = this.activityBuilder.buildUpdateWorkUnitActivity(
        card,
        threadId,
        workUnitId,
        updateWorkUnit,
      );
      return {
        [card.id]: {
          workThreads: workThreads,
          activity: activity ? [...card.activity, activity] : card.activity,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating work unit',
        error.message,
      );
    }
  }
}

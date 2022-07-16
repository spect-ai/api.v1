import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RequestProvider } from 'src/users/user.provider';
import { v4 as uuidv4 } from 'uuid';
import { ActivityBuilder } from './activity.builder';
import {
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from './dto/work-request.dto';
import { Card } from './model/card.model';
import { MappedCard } from './types/types';

@Injectable()
export class WorkService {
  constructor(
    private readonly activityBuilder: ActivityBuilder,
    private readonly requestProvider: RequestProvider,
  ) {}

  async createWorkThread(
    card: Card,
    createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<MappedCard> {
    try {
      const workUnitId = uuidv4();
      const workUnit = {};
      console.log(`ddd`);

      workUnit[workUnitId] = {
        user: this.requestProvider.user.id,
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
      console.log(workThreadOrder);

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
          content: createWorkUnit.content,
          workUnitId,
          createdAt: new Date(),
          updatedAt: new Date(),
          type: createWorkUnit.type,
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
          card.workThreads[threadId].workUnits[workUnitId].content,
        type:
          updateWorkUnit.type ||
          card.workThreads[threadId].workUnits[workUnitId].type,
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

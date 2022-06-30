import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import {
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from './dto/work-request.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly cardsService: CardsService,
  ) {}

  async createWorkThread(
    id: string,
    createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.cardsService.validateCardExists(card);

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

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            workThreads,
            workThreadOrder,
          },
        );
      return this.cardsService.enrichResponse(updatedCard);
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
      this.cardsService.validateCardExists(card);
      this.cardsService.validateCardThreadExists(card, threadId);

      card.workThreads[threadId] = {
        ...card.workThreads[threadId],
        ...updateWorkThread,
        updatedAt: new Date(),
      };

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            workThreads: card.workThreads,
          },
        );

      return await this.cardsService.enrichResponse(updatedCard);
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
      this.cardsService.validateCardExists(card);
      this.cardsService.validateCardThreadExists(card, threadId);

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

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            workThreads: card.workThreads,
          },
        );

      return await this.cardsService.enrichResponse(updatedCard);
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
      this.cardsService.validateCardExists(card);
      this.cardsService.validateCardThreadExists(card, threadId);

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

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            workThreads: card.workThreads,
          },
        );

      return await this.cardsService.enrichResponse(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating work unit',
        error.message,
      );
    }
  }
}

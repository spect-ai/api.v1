import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AutomationService } from 'src/automation/automation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { CardsProjectService } from 'src/project/cards.project.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { ActivityBuilder } from '../activity.builder';
import { CardsRepository } from '../cards.repository';
import { CardsService } from '../cards.service';
import { DetailedCardResponseDto } from '../dto/detailed-card-response-dto';
import {
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from '../dto/work-request.dto';
import { CardsPaymentService } from '../payment.cards.service';
import { CommonUtility, ResponseBuilder } from '../response.builder';
import { CardValidationService } from '../validation.cards.service';
import { WorkService } from '../work.cards.service';

@Injectable()
export class WorkCommandHandler {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly circleRepository: CirclesRepository,
    private readonly projectService: ProjectService,
    private readonly cardsProjectService: CardsProjectService,
    private readonly datastructureManipulationService: DataStructureManipulationService,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
    private readonly cardsService: CardsService,
    private readonly projectRepository: ProjectsRepository,
    private readonly automationService: AutomationService,
    private readonly cardPaymentService: CardsPaymentService,
    private readonly workService: WorkService,
    private readonly commonUtility: CommonUtility,
  ) {}

  async handleCreateWorkThread(
    id: string,
    createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);
      const project = await this.projectRepository.findById(card.project);
      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;

      const cardUpdate = await this.workService.createWorkThread(
        card,
        createWorkThread,
      );
      const globalUpdateAfterAutomation =
        this.automationService.handleAutomation(card, project, cardUpdate);
      return await this.commonUtility.mergeExecuteAndReturn(
        id,
        project.id,
        globalUpdate,
        globalUpdateAfterAutomation,
        cardUpdate,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work thread',
        error.message,
      );
    }
  }

  async handleUpdateWorkThread(
    id: string,
    threadId: string,
    updateWorkThread: UpdateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);
      const project = await this.projectRepository.findById(card.project);

      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;
      const cardUpdate = await this.workService.updateWorkThread(
        card,
        threadId,
        updateWorkThread,
      );

      const globalUpdateAfterAutomation =
        this.automationService.handleAutomation(card, project, cardUpdate[id]);

      return await this.commonUtility.mergeExecuteAndReturn(
        id,
        project.id,
        globalUpdate,
        globalUpdateAfterAutomation,
        cardUpdate,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work thread',
        error.message,
      );
    }
  }

  async handleCreateWorkUnit(
    id: string,
    threadId: string,
    createWorkUnit: CreateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);
      const project = await this.projectRepository.findById(card.project);

      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;
      const cardUpdate = await this.workService.createWorkUnit(
        card,
        threadId,
        createWorkUnit,
      );
      const globalUpdateAfterAutomation =
        this.automationService.handleAutomation(card, project, cardUpdate);

      return await this.commonUtility.mergeExecuteAndReturn(
        id,
        project.id,
        globalUpdate,
        globalUpdateAfterAutomation,
        cardUpdate,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work thread',
        error.message,
      );
    }
  }

  async handleUpdateWorkUnit(
    id: string,
    threadId: string,
    workUnitId: string,
    updateWorkUnit: UpdateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);
      const project = await this.projectRepository.findById(card.project);

      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;
      const cardUpdate = await this.workService.updateWorkUnit(
        card,
        threadId,
        workUnitId,
        updateWorkUnit,
      );
      console.log(cardUpdate);
      const globalUpdateAfterAutomation =
        this.automationService.handleAutomation(card, project, cardUpdate);

      return await this.commonUtility.mergeExecuteAndReturn(
        id,
        project.id,
        globalUpdate,
        globalUpdateAfterAutomation,
        cardUpdate,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed updating work unit',
        error.message,
      );
    }
  }
}

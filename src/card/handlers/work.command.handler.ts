import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AutomationService } from 'src/automation/automation.service';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { ProjectsRepository } from 'src/project/project.repository';
import { RequestProvider } from 'src/users/user.provider';
import { DetailedCardResponseDto } from '../dto/detailed-card-response-dto';
import {
  CreateGithubPRDto,
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from '../dto/work-request.dto';
import { CommonUtility } from '../response.builder';
import { WorkService } from '../work.cards.service';
import { CardsRepository } from '../cards.repository';
import { CommonTools } from 'src/common/common.service';
import { EventBus } from '@nestjs/cqrs';
import {
  WorkThreadCreatedEvent,
  WorkUnitCreatedEvent,
} from '../events/work/impl';
import { CirclesRepository } from 'src/circle/circles.repository';

const globalUpdate = {
  card: {},
  project: {},
} as GlobalDocumentUpdate;
@Injectable()
export class WorkCommandHandler {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly projectRepository: ProjectsRepository,
    private readonly automationService: AutomationService,
    private readonly workService: WorkService,
    private readonly commonUtility: CommonUtility,
    private readonly cardsRepository: CardsRepository,
    private readonly commonTool: CommonTools,
    private readonly eventBus: EventBus,
    private readonly circleRepository: CirclesRepository,
  ) {}

  async handleGithubPR(createGithubPRDto: CreateGithubPRDto): Promise<boolean> {
    try {
      /** Assumes all cards are from the same project */
      const cards = await this.cardsRepository.findAll({
        slug: { $in: createGithubPRDto.slugs },
      });

      const project = await this.projectRepository.findById(
        cards[0].project as string,
      );

      const objectifiedCards = this.commonTool.objectify(cards, 'id');
      const cardUpdates =
        await this.workService.createSameWorkThreadInMultipleCards(
          cards,
          createGithubPRDto,
        );

      let globalUpdateAfterAutomation: GlobalDocumentUpdate = {
        card: {},
        project: {},
      };
      for (const [cardId, cardUpdate] of Object.entries(cardUpdates)) {
        const update = this.automationService.handleAutomation(
          objectifiedCards[cardId],
          project,
          cardUpdate,
        );

        globalUpdateAfterAutomation = {
          ...globalUpdateAfterAutomation,
          ...update,
        };
      }
      const updates = await this.commonTool.mergeObjects(
        globalUpdateAfterAutomation.card,
        cardUpdates,
      );
      const acknowledgment = await this.cardsRepository.bundleUpdatesAndExecute(
        updates,
      );

      const projectAcknowledgment =
        await this.projectRepository.bundleUpdatesAndExecute(
          globalUpdateAfterAutomation.project,
        );
      if (acknowledgment.hasWriteErrors()) {
        console.log(acknowledgment.getWriteErrors());
        throw new InternalServerErrorException('Failed creating work thread');
      }
      return true;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating work thread',
        error.message,
      );
    }
  }

  async handleCreateWorkThread(
    id: string,
    createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card =
        this.requestProvider.card || (await this.cardsRepository.findById(id));
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(card.project as string));
      const circle =
        this.requestProvider.circle ||
        (await this.circleRepository.findById(card.circle));

      const cardUpdate = await this.workService.createWorkThread(
        card,
        createWorkThread,
      );
      const globalUpdateAfterAutomation =
        this.automationService.handleAutomation(card, project, cardUpdate[id]);
      const resCard = await this.commonUtility.mergeExecuteAndReturn(
        id,
        project.id,
        globalUpdate,
        globalUpdateAfterAutomation,
        cardUpdate,
      );
      this.eventBus.publish(
        new WorkThreadCreatedEvent(
          resCard,
          createWorkThread,
          circle.slug,
          project.slug,
          this.requestProvider.user.id,
        ),
      );
      return resCard;
    } catch (error) {
      console.log(error);
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
      const card =
        this.requestProvider.card || (await this.cardsRepository.findById(id));
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(card.project as string));

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
      const card =
        this.requestProvider.card || (await this.cardsRepository.findById(id));
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(card.project as string));
      const circle =
        this.requestProvider.circle ||
        (await this.circleRepository.findById(card.circle));

      const cardUpdate = await this.workService.createWorkUnit(
        card,
        threadId,
        createWorkUnit,
      );
      const globalUpdateAfterAutomation =
        this.automationService.handleAutomation(card, project, cardUpdate[id]);

      const resCard = await this.commonUtility.mergeExecuteAndReturn(
        id,
        project.id,
        globalUpdate,
        globalUpdateAfterAutomation,
        cardUpdate,
      );
      this.eventBus.publish(
        new WorkUnitCreatedEvent(
          resCard,
          createWorkUnit,
          circle.slug,
          project.slug,
          this.requestProvider.user.id,
          threadId,
        ),
      );

      return resCard;
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
      const card =
        this.requestProvider.card || (await this.cardsRepository.findById(id));
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(card.project as string));

      const cardUpdate = await this.workService.updateWorkUnit(
        card,
        threadId,
        workUnitId,
        updateWorkUnit,
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
      console.log(error);
      throw new InternalServerErrorException(
        'Failed updating work unit',
        error.message,
      );
    }
  }
}

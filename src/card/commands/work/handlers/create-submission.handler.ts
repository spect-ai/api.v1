import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { PerformMultipleAutomationsCommand } from 'src/automation/commands/impl';
import { MultipleItemContainer } from 'src/automation/types/types';
import { CardsRepository } from 'src/card/cards.repository';
import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import {
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
} from 'src/card/dto/work-request.dto';
import {
  WorkThreadCreatedEvent,
  WorkUnitCreatedEvent,
} from 'src/card/events/impl';
import { Card } from 'src/card/model/card.model';
import { ActivityBuilder } from 'src/card/services/activity-builder.service';
import { CardsService } from 'src/card/services/cards.service';
import { CommonUpdateService } from 'src/card/services/common-update.service';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { MappedPartialItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { v4 as uuidv4 } from 'uuid';
import { CreateWorkThreadCommand, CreateWorkUnitCommand } from '../impl';

@CommandHandler(CreateWorkThreadCommand)
export class CreateWorkThreadCommandHandler
  implements ICommandHandler<CreateWorkThreadCommand>
{
  constructor(
    private readonly cardRepository: CardsRepository,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly activityBuilder: ActivityBuilder,
    private readonly cardsService: CardsService,
    private readonly commonUpdateService: CommonUpdateService,
  ) {
    this.logger.setContext('CreateWorkThreadCommandHandler');
  }

  async execute(
    command: CreateWorkThreadCommand,
  ): Promise<DetailedCardResponseDto> {
    try {
      console.log('CreateWorkUnitCommandHandler');
      const { id, createWorkThread, caller } = command;

      const card = await this.cardRepository.findById(id);
      const project = await this.queryBus.execute(
        new GetProjectByIdQuery(card.project),
      );
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(card.circle),
      );

      let cardUpdate = await this.createWorkThread(
        createWorkThread,
        card,
        caller,
      );
      const multipleItemContainer: MultipleItemContainer =
        await this.commandBus.execute(
          new PerformMultipleAutomationsCommand(
            [cardUpdate[card.id]],
            this.commonTools.objectify([card], 'id'),
            caller,
            { [card.id]: project },
            { [card.id]: circle },
          ),
        );

      cardUpdate = this.cardsService.merge(
        cardUpdate,
        multipleItemContainer.cards,
      );

      const diff = this.cardsService.getDifference(card, cardUpdate);
      const resCard = await this.commonUpdateService.executeAndReturn(
        card.id,
        cardUpdate,
        multipleItemContainer.projects,
      );

      this.eventBus.publish(
        new WorkThreadCreatedEvent(
          resCard,
          createWorkThread,
          circle.slug,
          project.slug,
          caller,
        ),
      );
      return resCard;
    } catch (error) {
      this.logger.error(
        `Failed adding item to card with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed adding item update',
        error.message,
      );
    }
  }

  async createWorkThread(
    createWorkThread: CreateWorkThreadRequestDto,
    card: Card,
    caller: string,
  ): Promise<MappedPartialItem<Card>> {
    try {
      const workUnitId = uuidv4();
      const workUnit = {};

      workUnit[workUnitId] = {
        user: caller,
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
        caller,
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

@CommandHandler(CreateWorkUnitCommand)
export class CreateWorkUnitCommandHandler
  implements ICommandHandler<CreateWorkUnitCommand>
{
  constructor(
    private readonly cardRepository: CardsRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly activityBuilder: ActivityBuilder,
    private readonly cardsService: CardsService,
    private readonly commonTools: CommonTools,
    private readonly commonUpdateService: CommonUpdateService,
  ) {
    this.logger.setContext('CreateWorkUnitCommandHandler');
  }

  async execute(
    command: CreateWorkUnitCommand,
  ): Promise<DetailedCardResponseDto> {
    try {
      const { id, threadId, createWorkUnit, caller } = command;
      const card = await this.cardRepository.findById(id);
      const project = await this.queryBus.execute(
        new GetProjectByIdQuery(card.project),
      );
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(card.circle),
      );

      let cardUpdate = await this.createWorkUnit(
        card,
        threadId,
        createWorkUnit,
        caller,
      );
      const multipleItemContainer: MultipleItemContainer =
        await this.commandBus.execute(
          new PerformMultipleAutomationsCommand(
            [cardUpdate[card.id]],
            this.commonTools.objectify([card], 'id'),
            caller,
            { [card.id]: project },
            { [card.id]: circle },
          ),
        );

      cardUpdate = this.cardsService.merge(
        cardUpdate,
        multipleItemContainer.cards,
      );

      const diff = this.cardsService.getDifference(card, cardUpdate);
      const resCard = await this.commonUpdateService.executeAndReturn(
        card.id,
        cardUpdate,
        multipleItemContainer.projects,
      );

      this.eventBus.publish(
        new WorkUnitCreatedEvent(
          resCard,
          createWorkUnit,
          circle.slug,
          project.slug,
          caller,
          threadId,
        ),
      );

      return resCard;
    } catch (error) {
      this.logger.error(
        `Failed adding item to card with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed adding item update',
        error.message,
      );
    }
  }

  async createWorkUnit(
    card: Card,
    threadId: string,
    createWorkUnit: CreateWorkUnitRequestDto,
    caller: string,
  ): Promise<MappedPartialItem<Card>> {
    try {
      const workUnitId = uuidv4();
      const workUnits = {
        ...card.workThreads[threadId].workUnits,
        [workUnitId]: {
          unitId: workUnitId,
          user: caller,
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
        caller,
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
}

import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { PerformMultipleAutomationsCommand } from 'src/automation/commands/impl';
import { MultipleItemContainer } from 'src/automation/types/types';
import { CardsRepository } from 'src/card/cards.repository';
import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import {
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from 'src/card/dto/work-request.dto';
import { Card } from 'src/card/model/card.model';
import { ActivityBuilder } from 'src/card/services/activity-builder.service';
import { CardsService } from 'src/card/services/cards.service';
import { CommonUpdateService } from 'src/card/services/common-update.service';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { MappedPartialItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { UpdateWorkThreadCommand, UpdateWorkUnitCommand } from '../impl';

@CommandHandler(UpdateWorkThreadCommand)
export class UpdateWorkThreadCommandHandler
  implements ICommandHandler<UpdateWorkThreadCommand>
{
  constructor(
    private readonly cardRepository: CardsRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly activityBuilder: ActivityBuilder,
    private readonly cardsService: CardsService,
    private readonly commonTools: CommonTools,
    private readonly commonUpdateService: CommonUpdateService,
  ) {
    this.logger.setContext('UpdateWorkThreadCommandHandler');
  }

  async execute(
    command: UpdateWorkThreadCommand,
  ): Promise<DetailedCardResponseDto> {
    try {
      console.log('UpdateWorkThreadCommandHandler');
      const { id, threadId, updateWorkThread, caller } = command;

      const card = await this.cardRepository.findById(id);
      const project = await this.queryBus.execute(
        new GetProjectByIdQuery(card.project),
      );
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(card.circle),
      );

      let cardUpdate = await this.updateWorkThread(
        card,
        threadId,
        updateWorkThread,
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
      return resCard;
    } catch (error) {
      this.logger.error(
        `Failed updating work thread with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed updating work thread',
        error.message,
      );
    }
  }

  async updateWorkThread(
    card: Card,
    threadId: string,
    updateWorkThread: UpdateWorkThreadRequestDto,
    caller: string,
  ): Promise<MappedPartialItem<Card>> {
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
      caller,
      card,
      threadId,
      updateWorkThread,
    );

    return {
      [card.id]: {
        id: card.id,
        workThreads: workThreads,
        activity: activity ? [...card.activity, activity] : card.activity,
      },
    };
  }
}

@CommandHandler(UpdateWorkUnitCommand)
export class UpdateWorkUnitCommandHandler
  implements ICommandHandler<UpdateWorkUnitCommand>
{
  constructor(
    private readonly cardRepository: CardsRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly activityBuilder: ActivityBuilder,
    private readonly cardsService: CardsService,
    private readonly commonTools: CommonTools,
    private readonly commonUpdateService: CommonUpdateService,
  ) {
    this.logger.setContext('UpdateWorkUnitCommandHandler');
  }

  async execute(
    command: UpdateWorkUnitCommand,
  ): Promise<DetailedCardResponseDto> {
    try {
      console.log('UpdateWorkUnitCommandHandler');
      const { id, threadId, workUnitId, updateWorkUnit, caller } = command;

      const card = await this.cardRepository.findById(id);
      const project = await this.queryBus.execute(
        new GetProjectByIdQuery(card.project),
      );
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(card.circle),
      );

      let cardUpdate = await this.updateWorkUnit(
        card,
        threadId,
        workUnitId,
        updateWorkUnit,
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
      return resCard;
    } catch (error) {
      this.logger.error(
        `Failed updating work unit with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed updating work unit',
        error.message,
      );
    }
  }

  async updateWorkUnit(
    card: Card,
    threadId: string,
    workUnitId: string,
    updateWorkUnit: UpdateWorkUnitRequestDto,
    caller: string,
  ): Promise<MappedPartialItem<Card>> {
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
      caller,
      card,
      threadId,
      workUnitId,
      updateWorkUnit,
    );
    return {
      [card.id]: {
        id: card.id,
        workThreads: workThreads,
        activity: activity ? [...card.activity, activity] : card.activity,
      },
    };
  }
}

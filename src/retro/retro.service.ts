import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { RequestProvider } from 'src/users/user.provider';
import {
  CreateRetroCommand,
  EndRetroCommand,
  UpdateRetroVoteCommand,
} from './commands/impl';
import { AddFeedbackCommand } from './commands/impl/add-feedback.command';
import { UpdateRetroCommand } from './commands/impl/update-retro.command';
import { AddFeedbackRequestDto } from './dto/add-feedback-request.dto';
import { CreateRetroRequestDto } from './dto/create-retro-request.dto';
import { DetailedRetroResponseDto } from './dto/detailed-retro-response.dto';
import {
  UpdateRetroRequestDto,
  UpdateVoteRequestDto,
} from './dto/update-retro-request.dto';
import { RetroCreatedEvent, RetroEndedEvent } from './events/impl';
import { Retro } from './models/retro.model';
import { GetRetroByIdQuery, GetRetroBySlugQuery } from './queries/impl';
import { RetroRepository } from './retro.repository';
import { MappedFeedback, MappedStats } from './types';
import { LoggingService } from 'src/logging/logging.service';
import { ArchiveRetroCommand } from './commands/impl/archive-retro.command';

@Injectable()
export class RetroService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly retroRepository: RetroRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('RetroService');
  }

  private async enrichResponse(
    retro: Retro,
  ): Promise<DetailedRetroResponseDto> {
    let feedbackGiven = {} as MappedFeedback;
    let feedbackReceived = {} as MappedFeedback;
    const stats = retro.stats as MappedStats;
    if (this.requestProvider.user) {
      for (const [userId] of Object.entries(retro.stats)) {
        const stat = stats?.[userId];
        let voted = false;
        if (retro.stats[userId].votesRemaining != 100) {
          voted = true;
        }
        Object.assign(stat, { voted });
      }
      for (const [userId] of Object.entries(retro.stats)) {
        if (userId !== this.requestProvider.user.id) {
          delete retro.stats[userId].votesGiven;
          delete retro.stats[userId].votesRemaining;
          delete retro.stats[userId].votesAllocated;
        }
      }
      if (retro.feedbackGiven) {
        feedbackGiven = retro.feedbackGiven[this.requestProvider.user.id] || {};
        feedbackReceived = {} as MappedFeedback;
        if (!retro.status.active) {
          for (const [
            feedbackGiver,
            feedbackReceiverToFeedback,
          ] of Object.entries(retro.feedbackGiven)) {
            feedbackReceived[feedbackGiver] =
              feedbackReceiverToFeedback[this.requestProvider.user.id];
          }
        }
      }
    }
    return Object.assign(retro, {
      feedbackGiven,
      feedbackReceived,
      stats,
    });
  }

  async create(
    createRetroDto: CreateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(createRetroDto.circle),
      );
      const createdRetro = await this.commandBus.execute(
        new CreateRetroCommand(
          createRetroDto,
          circle,
          this.requestProvider.user.id,
        ),
      );

      // TODO: Switch to command bus
      if (createdRetro?.circle) {
        await this.circlesRepository.updateById(createdRetro.circle as string, {
          ...circle,
          retro: [...(circle.retro || []), createdRetro],
        });
      }
      this.eventBus.publish(new RetroCreatedEvent(createdRetro, circle.slug));
      const res = await this.enrichResponse(createdRetro);

      return res;
    } catch (error) {
      this.logger.logError(
        `Failed retro creation with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed retro creation',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updateRetroDto: UpdateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const updatedRetro = await this.commandBus.execute(
        new UpdateRetroCommand(id, updateRetroDto),
      );
      return await this.enrichResponse(updatedRetro);
    } catch (error) {
      this.logger.logError(
        `Failed retro update with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed retro update',
        error.message,
      );
    }
  }

  async vote(
    id: string,
    updateVoteRequestDto: UpdateVoteRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));
      const updatedRetro = await this.commandBus.execute(
        new UpdateRetroVoteCommand(
          this.requestProvider.user.id,
          retro,
          updateVoteRequestDto,
        ),
      );
      return await this.enrichResponse(updatedRetro);
    } catch (error) {
      this.logger.logError(
        `Failed voting on retro with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed voting on retro',
        error.message,
      );
    }
  }

  async addFeedback(
    id: string,
    addFeedbackRequestDto: AddFeedbackRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));
      const updatedRetro = await this.commandBus.execute(
        new AddFeedbackCommand(
          this.requestProvider.user.id,
          retro,
          addFeedbackRequestDto,
        ),
      );
      return await this.enrichResponse(updatedRetro);
    } catch (error) {
      this.logger.logError(
        `Failed adding feedback on retro with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed adding feedback on retro',
        error.message,
      );
    }
  }

  async endRetro(id: string): Promise<DetailedRetroResponseDto> {
    try {
      const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));
      const updatedRetro = await this.commandBus.execute(
        new EndRetroCommand(retro),
      );
      this.eventBus.publish(
        new RetroEndedEvent(retro, this.requestProvider.user.id),
      );
      return this.enrichResponse(updatedRetro);
    } catch (error) {
      this.logger.logError(
        `Failed ending retro with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed ending retro',
        error.message,
      );
    }
  }

  async getDetailedRetro(id: string): Promise<DetailedRetroResponseDto> {
    try {
      const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));

      return await this.enrichResponse(retro);
    } catch (error) {
      this.logger.logError(
        `Failed getting retro by id with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while getting retro',
        error.message,
      );
    }
  }

  async getDetailedRetroBySlug(
    slug: string,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const retro = await this.queryBus.execute(new GetRetroBySlugQuery(slug));
      return await this.enrichResponse(retro);
    } catch (error) {
      this.logger.logError(
        `Failed getting retro by slug with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while getting retro',
        error.message,
      );
    }
  }

  async archive(id: string): Promise<boolean> {
    const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));
    if (!retro) {
      throw new HttpException('Retro not found', HttpStatus.NOT_FOUND);
    }
    const archivedRetro = await this.commandBus.execute(
      new ArchiveRetroCommand(retro),
    );
    return true;
  }
}

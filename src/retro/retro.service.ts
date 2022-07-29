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
import { UpdateRetroRequestDto } from './dto/update-retro-request.dto';
import { UpdateVoteRequestDto } from './dto/update-retro-vote-request.dto';
import { RetroCreatedEvent, RetroEndedEvent } from './events/impl';
import { Retro } from './models/retro.model';
import { GetRetroByIdQuery, GetRetroBySlugQuery } from './queries/impl';
import { RetroRepository } from './retro.repository';
import { MappedFeedback } from './types';

@Injectable()
export class RetroService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly retroRepository: RetroRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly circlesRepository: CirclesRepository,
    private readonly circlesService: CirclesService,
  ) {}

  private async enrichResponse(
    retro: Retro,
  ): Promise<DetailedRetroResponseDto> {
    const stats = {
      [this.requestProvider.user.id]: retro.stats[this.requestProvider.user.id],
    };
    if (this.requestProvider)
      if (retro.feedbackGiven) {
        const feedbackGiven = retro.feedbackGiven[this.requestProvider.user.id];
        const feedbackReceived = {} as MappedFeedback;
        if (!retro.status.active)
          for (const [
            feedbackGiver,
            feedbackReceiverToFeedback,
          ] of Object.entries(retro.feedbackGiven)) {
            feedbackReceived[feedbackGiver] =
              feedbackReceiverToFeedback[this.requestProvider.user.id];
          }
        return {
          ...retro,
          feedbackGiven,
          feedbackReceived,
          stats,
        };
      }
    return {
      ...retro,
      feedbackGiven: {},
      stats,
    };
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
      return await this.enrichResponse(createdRetro);
    } catch (error) {
      console.log(error);
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
    const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));
    const updatedRetro = await this.commandBus.execute(
      new UpdateRetroVoteCommand(
        this.requestProvider.user.id,
        retro,
        updateVoteRequestDto,
      ),
    );
    return await this.enrichResponse(updatedRetro);
  }

  async addFeedback(
    id: string,
    addFeedbackRequestDto: AddFeedbackRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));
    const updatedRetro = await this.commandBus.execute(
      new AddFeedbackCommand(
        this.requestProvider.user.id,
        retro,
        addFeedbackRequestDto,
      ),
    );
    return await this.enrichResponse(updatedRetro);
  }

  async endRetro(id: string): Promise<DetailedRetroResponseDto> {
    const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));
    const updatedRetro = await this.commandBus.execute(
      new EndRetroCommand(retro),
    );
    this.eventBus.publish(
      new RetroEndedEvent(retro, this.requestProvider.user.id),
    );
    return this.enrichResponse(updatedRetro);
  }

  async getDetailedRetro(id: string): Promise<DetailedRetroResponseDto> {
    try {
      const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));

      return await this.enrichResponse(retro);
    } catch (error) {
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
      throw new InternalServerErrorException(
        'Failed while getting retro',
        error.message,
      );
    }
  }

  async delete(id: string): Promise<DetailedRetroResponseDto> {
    const retro = await this.retroRepository.findById(id);
    if (!retro) {
      throw new HttpException('Retro not found', HttpStatus.NOT_FOUND);
    }
    const deletedRetro = await this.retroRepository.deleteById(id);
    return await this.enrichResponse(deletedRetro);
  }
}

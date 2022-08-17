import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { RequestProvider } from 'src/users/user.provider';
import { CreateCircleCommand } from '../commands/impl';
import { UpdateCircleCommand } from '../commands/impl/update-circle.command';
import { CreateCircleRequestDto } from '../dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from '../dto/detailed-circle-response.dto';
import { UpdateCircleRequestDto } from '../dto/update-circle-request.dto';

@Injectable()
export class CirclesCrudService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {
    logger.setContext('CirclesCrudService');
  }

  async create(
    createCircleDto: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new CreateCircleCommand(createCircleDto, this.requestProvider.user.id),
      );
      return circle;
    } catch (error) {
      this.logger.logError(
        `Failed circle creation with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed circle creation',
        error.message,
      );
    }
  }

  async update(
    id: string,
    createCircleDto: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new UpdateCircleCommand(
          id,
          createCircleDto,
          this.requestProvider.user.id,
        ),
      );
      return circle;
    } catch (error) {
      this.logger.logError(
        `Failed circle creation with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed circle creation',
        error.message,
      );
    }
  }
}

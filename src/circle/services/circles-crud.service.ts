import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { RequestProvider } from 'src/users/user.provider';
import { CreateCircleCommand } from '../commands/impl';
import { UpdateCircleCommand } from '../commands/impl/update-circle.command';
import { CreateCircleRequestDto } from '../dto/create-circle-request.dto';
import {
  BucketizedCircleResponseDto,
  DetailedCircleResponseDto,
} from '../dto/detailed-circle-response.dto';
import { UpdateCircleRequestDto } from '../dto/update-circle-request.dto';
import { GetMultipleCirclesQuery } from '../queries/impl';

@Injectable()
export class CirclesCrudService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    logger.setContext('CirclesCrudService');
  }

  async getPubicParentCircles(
    getCirclePopulatedFields: object,
    getCircleProjectedFields: any,
  ): Promise<BucketizedCircleResponseDto> {
    const circles = (await this.queryBus.execute(
      new GetMultipleCirclesQuery(
        {
          parents: { $exists: true, $eq: [] },
          'status.archived': false,
        },
        getCirclePopulatedFields,
        getCircleProjectedFields,
      ),
    )) as DetailedCircleResponseDto[];

    const res = {
      memberOf: [],
      claimable: [],
      joinable: [],
    };
    for (const circle of circles) {
      if (circle.members.includes(this.requestProvider.user?.id)) {
        res.memberOf.push(circle);
      } else if (!circle.private) {
        if (circle.toBeClaimed) {
          res.claimable.push(circle);
        } else res.joinable.push(circle);
      }
    }
    return res;
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

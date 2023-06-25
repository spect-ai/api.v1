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
  CircleResponseDto,
} from '../dto/detailed-circle-response.dto';
import {
  UpdateCircleRequestDto,
  WhitelistAddressRequestDto,
} from '../dto/update-circle-request.dto';
import { Circle } from '../model/circle.model';
import {
  GetCircleByFilterQuery,
  GetCircleBySlugQuery,
  GetMultipleCirclesQuery,
} from '../queries/impl';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesPrivateRepository } from '../circles-private.repository';

const getCirclePopulatedFields = {
  projects: {
    name: 1,
    slug: 1,
    description: 1,
    discordDiscussionChannel: 1,
    id: 1,
  },
  retro: {
    title: 1,
    slug: 1,
    id: 1,
    status: 1,
    reward: 1,
    members: 1,
  },
  parents: {
    name: 1,
    slug: 1,
    description: 1,
    id: 1,
  },
  collections: {
    name: 1,
    slug: 1,
    id: 1,
  },
  children: {
    name: 1,
    slug: 1,
    description: 1,
    id: 1,
    avatar: 1,
  },
};

const getCircleProjectedFields = {
  invites: 0,
  localRegistry: 0,
};

const propertiesToReturnInPrivateCircle = new Set([
  'roles',
  'memberRoles',
  'id',
  '_id',
  'name',
  'description',
  'slug',
]);
@Injectable()
export class CirclesCrudService {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly circlePrivateRepository: CirclesPrivateRepository,
    private readonly requestProvider: RequestProvider,
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    logger.setContext('CirclesCrudService');
  }

  async getPubicParentCircles(): Promise<BucketizedCircleResponseDto> {
    const circles = (await this.queryBus.execute(
      new GetMultipleCirclesQuery(
        {
          $or: [
            {
              parents: { $exists: true, $eq: [] },
              'status.archived': false,
            },
          ],
        },
        getCirclePopulatedFields,
        getCircleProjectedFields,
      ),
    )) as Circle[];

    const res = {
      memberOf: [],
      claimable: [],
      joinable: [],
    };
    for (const circle of circles) {
      if (circle.members.includes(this.requestProvider.user?.id)) {
        res.memberOf.push(circle);
      } else if (!circle.private || circle.forceShowOnExplore) {
        if (circle.toBeClaimed) {
          res.claimable.push(circle);
        } else res.joinable.push(circle);
      }
    }
    res.joinable.sort(function (a, b) {
      if (
        (a.projects?.length || 0 + 1) *
          (a.children?.length || 0 + 1) *
          (a.members?.length || 0 + 1) <
        (b.projects?.length || 0 + 1) *
          (b.children?.length || 0 + 1) *
          (b.members?.length || 0 + 1)
      )
        return 1;
      if (
        (a.projects?.length || 0 + 1) *
          (a.children?.length || 0 + 1) *
          (a.members?.length || 0 + 1) >
        (b.projects?.length || 0 + 1) *
          (b.children?.length || 0 + 1) *
          (b.members?.length || 0 + 1)
      )
        return -1;
      return 0;
    });
    if (this.requestProvider.user?.id) return res;
  }

  private async filterPrivateProperties(
    circle: CircleResponseDto,
    caller?: string,
  ): Promise<CircleResponseDto> {
    if (circle.private && (!caller || !circle.members.includes(caller))) {
      Object.keys(circle).forEach((item) => {
        if (!propertiesToReturnInPrivateCircle.has(item)) delete circle[item];
      });
      (circle as CircleResponseDto).unauthorized = true;
    } else {
      delete (circle as CircleResponseDto).invites;
    }

    let hasSetupZealy = false;
    try {
      hasSetupZealy = await this.circlePrivateRepository.exists({
        circleId: circle.id,
      });
    } catch (e) {
      hasSetupZealy = false;
    }

    return {
      ...circle,
      hasSetupZealy,
    };
  }

  async getById(id: string): Promise<CircleResponseDto> {
    try {
      const circle = await this.queryBus.execute(
        new GetCircleByFilterQuery(
          {
            _id: id,
          },
          getCirclePopulatedFields,
          getCircleProjectedFields,
        ),
      );
      const circleDetails =
        await this.circlesRepository.getCircleWithMinimalDetails(circle);
      return await this.filterPrivateProperties(
        circleDetails,
        this.requestProvider.user?.id,
      );
    } catch (error) {
      this.logger.logError(
        `Failed getting circle with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed getting circle ',
        error.message,
      );
    }
  }

  async getBySlug(slug: string): Promise<CircleResponseDto> {
    try {
      const circle = await this.queryBus.execute(
        new GetCircleBySlugQuery(slug),
      );
      const circleDetails =
        await this.circlesRepository.getCircleWithMinimalDetails(circle);

      return await this.filterPrivateProperties(
        circleDetails,
        this.requestProvider.user?.id,
      );
    } catch (error) {
      this.logger.logError(
        `Failed getting circle  with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed getting circle ',
        error.message,
      );
    }
  }

  async create(
    createCircleDto: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new CreateCircleCommand(createCircleDto, this.requestProvider.user),
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
    createCircleDto: UpdateCircleRequestDto | WhitelistAddressRequestDto,
  ): Promise<CircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new UpdateCircleCommand(
          id,
          createCircleDto,
          this.requestProvider.user.id,
        ),
      );
      const circleDetails =
        await this.circlesRepository.getCircleWithMinimalDetails(circle);
      return await this.filterPrivateProperties(
        circleDetails,
        this.requestProvider.user?.id,
      );
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

import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { GetMultipleCirclesQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { GetCirclesCommand } from '../impl/get-circles.command';

@CommandHandler(GetCirclesCommand)
export class GetCirclesCommandHandler
  implements ICommandHandler<GetCirclesCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('GetCirclesCommandHandler');
  }

  async execute(command: GetCirclesCommand) {
    const { userId } = command;
    try {
      console.log({ userId });
      const user = await this.userRepository.findById(userId);
      const circles = await this.queryBus.execute(
        new GetMultipleCirclesQuery(
          {
            _id: {
              $in: user?.circles || [],
            },
            'status.archived': false,
          },
          {
            parents: {
              slug: 1,
              avatar: 1,
              id: 1,
              name: 1,
              gradient: 1,
            },
            memberRoles: 1,
            collections: {
              slug: 1,
            },
          },
        ),
      );
      console.log({ circles });
      return circles.map((circle: any) => {
        return {
          name: circle.name,
          slug: circle.slug,
          description: circle.description,
          id: circle._id.toString(),
          avatar: circle.avatar || circle.parents[0]?.avatar,
          parents: circle.parents,
          gradient: circle.gradient || circle.parents[0]?.gradient,
          collections: circle.collections,
          memberRoles: circle.memberRoles,
        };
      });
    } catch (err) {
      this.logger.error(`Failed getting circles with error ${err}`);
      throw new InternalServerErrorException(
        `Failed getting circles with error ${err}`,
      );
    }
  }
}

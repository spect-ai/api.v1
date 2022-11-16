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
    this.logger.setContext('AddEducationCommandHandler');
  }

  async execute(command: GetCirclesCommand) {
    const { userId } = command;
    try {
      console.log({ userId });
      const user = await this.userRepository.findById(userId);
      const circles = await this.queryBus.execute(
        new GetMultipleCirclesQuery({
          _id: {
            $in: user?.circles || [],
          },
          'status.archived': false,
        }),
      );
      return circles.map((circle) => {
        return {
          name: circle.name,
          slug: circle.slug,
          description: circle.description,
          id: circle._id.toString(),
          avatar: circle.avatar,
        };
      });
    } catch (err) {
      this.logger.error(`Failed adding education to user with error ${err}`);
      throw new InternalServerErrorException(
        `Failed adding education to user with error ${err}`,
      );
    }
  }
}

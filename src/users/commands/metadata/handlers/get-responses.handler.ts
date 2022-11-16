import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { GetMultipleCirclesQuery } from 'src/circle/queries/impl';
import { Collection } from 'src/collection/model/collection.model';
import { GetMultipleCollectionsQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { GetCirclesCommand } from '../impl/get-circles.command';
import { GetResponsesCommand } from '../impl/get-responses.command';

@CommandHandler(GetResponsesCommand)
export class GetResponsesCommandHandler
  implements ICommandHandler<GetResponsesCommand>
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
      const collections = await this.queryBus.execute(
        new GetMultipleCollectionsQuery({
          slug: {
            $in: user?.collectionsSubmittedTo || [],
          },
          // 'status.archived': false,
        }),
      );
      console.log({ collections });
      return collections.map((collection: Collection) => {
        return {
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          id: collection._id.toString(),
          logo: collection.logo,
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

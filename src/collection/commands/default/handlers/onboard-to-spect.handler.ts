import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { CollectionRepository } from 'src/collection/collection.repository';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { CreateFolderCommand } from 'src/circle/commands/impl';
import { RegistryService } from 'src/registry/registry.service';
import { OnboardToSpectProjectCommand } from '../impl';
import { getOnboardToSpectProjectDetails } from '../utils';
import { GetProfileQuery } from 'src/users/queries/impl';

@CommandHandler(OnboardToSpectProjectCommand)
export class OnboardToSpectProjectCommandHandler
  implements ICommandHandler<OnboardToSpectProjectCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly registryService: RegistryService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(OnboardToSpectProjectCommandHandler.name);
  }

  async execute(command: OnboardToSpectProjectCommand): Promise<Circle> {
    try {
      const { id, caller } = command;

      const botUser = await this.queryBus.execute(
        new GetProfileQuery(
          {
            username: 'Stu, the Spect Bot',
          },
          '',
        ),
      );

      // 1. Create Kanban project
      const onboardingProjectDto = getOnboardToSpectProjectDetails(botUser.id);
      const onboardingProject = await this.collectionRepository.create({
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        ...onboardingProjectDto,
      } as any);

      // 2. Update the circle
      await this.commandBus.execute(
        new UpdateCircleCommand(
          id,
          {
            collections: [onboardingProject.id],
          },
          caller,
        ),
      );

      // 3. Create a Folder
      const updatedCircle = await this.commandBus.execute(
        new CreateFolderCommand(id, {
          name: 'Welcome to Spect',
          avatar: 'All',
          contentIds: [onboardingProject.id],
        }),
      );

      return updatedCircle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}

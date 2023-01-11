import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { LoggingService } from 'src/logging/logging.service';
import { CreateGrantWorkflowCommand } from '../impl/index';
import { v4 as uuidv4 } from 'uuid';
import { CollectionRepository } from 'src/collection/collection.repository';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { CreateFolderCommand } from 'src/circle/commands/impl';
import {
  getGrantApplicationFormDetails,
  getOnboardingTasksProjectDetails,
} from '../utils';
import { OnboardingWorkflowCommand } from '../impl/onboarding-workflow.command';

@CommandHandler(OnboardingWorkflowCommand)
export class OnboardingWorkflowCommandHandler
  implements ICommandHandler<OnboardingWorkflowCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(OnboardingWorkflowCommandHandler.name);
  }

  async execute(command: CreateGrantWorkflowCommand): Promise<Circle> {
    try {
      const { id, templateDto, caller } = command;
      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(id, {}),
      );

      // 1. Create Onboarding Form
      const onboardingformDetails = getGrantApplicationFormDetails(
        circle,
        templateDto.snapshot,
        templateDto.permissions,
      );
      const onboardingForm = await this.collectionRepository.create({
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        ...onboardingformDetails,
      } as any);

      // 2. Create Onboarding tasks project
      const projectViewId = uuidv4();
      const onboardingProjectDto = getOnboardingTasksProjectDetails(
        circle,
        projectViewId,
      );
      const onboardingProject = await this.collectionRepository.create({
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        ...onboardingProjectDto,
      } as any);

      // 3. Add Automations
      // const automations = getAutomations(
      //   id,
      //   grantee.id,
      //   grantee.slug,
      //   onboardingProject.id,
      //   onboardingProject.slug,
      //   onboardingForm.slug,
      //   templateDto.roles,
      //   templateDto.channelCategory,
      // );

      // for (const i in automations) {
      //   await this.commandBus.execute(
      //     new AddAutomationCommand(id, automations?.[i] as any),
      //   );
      // }

      // 4. Create a Folder
      await this.commandBus.execute(
        new CreateFolderCommand(id, {
          name: 'Grants Workflow',
          avatar: 'Grants Workflow',
          contentIds: [onboardingForm.id, onboardingProject.id],
        }),
      );

      // 5. Update the circle
      const updatedCircle = await this.commandBus.execute(
        new UpdateCircleCommand(
          id,
          {
            collections: [
              ...(circle.collections || []),
              onboardingForm.id,
              onboardingProject.id,
            ],
          },
          caller,
        ),
      );

      return updatedCircle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}

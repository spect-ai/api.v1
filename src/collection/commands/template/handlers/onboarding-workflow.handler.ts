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
  getOnboardingFormDetails,
  getOnboardingTasksProjectDetails,
} from '../utils';
import { OnboardingWorkflowCommand } from '../impl/onboarding-workflow.command';
import { getOnboardingflowAutomations } from '../utils/constants/onboardingTemplate/onboardingAutomations';
import { AddAutomationCommand } from 'src/circle/commands/automation/impl';

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
      const onboardingformDetails = getOnboardingFormDetails(circle);
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
      const automations = getOnboardingflowAutomations(
        id,
        onboardingProject,
        onboardingForm.slug,
        templateDto.roles,
      );

      for (const i in automations) {
        await this.commandBus.execute(
          new AddAutomationCommand(id, automations?.[i] as any),
        );
      }

      // 4. Update the circle
      await this.commandBus.execute(
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

      // 5. Create a Folder
      const updatedCircle = await this.commandBus.execute(
        new CreateFolderCommand(id, {
          name: 'Onboarding Workflow',
          avatar: 'Onboarding Workflow',
          contentIds: [onboardingForm.id, onboardingProject.id],
        }),
      );

      return updatedCircle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}

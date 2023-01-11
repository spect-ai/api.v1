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
import { AddRoleCommand, CreateFolderCommand } from 'src/circle/commands/impl';
import { AddAutomationCommand } from 'src/circle/commands/automation/impl';
import {
  getGrantApplicationFormDetails,
  getGranteeCollectionDto,
  getMilestoneCollectionDetails,
} from '../utils';
import { getAutomations } from '../utils/constants/grantTemplate/grantApplicationForm';
import { defaultCircleRoles } from 'src/constants';
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

      // 2. Create Milestone Collection
      const milstoneViewId = uuidv4();
      const milestoneCollectionDto = getMilestoneCollectionDetails(
        circle,
        milstoneViewId,
      );
      const milestone = await this.collectionRepository.create({
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        ...milestoneCollectionDto,
      } as any);

      // 3. Create Grantee Collection
      const granteeViewId = uuidv4();
      const granteeCollectionDto = getGranteeCollectionDto(
        circle,
        granteeViewId,
      );
      const grantee = await this.collectionRepository.create({
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        ...granteeCollectionDto,
      } as any);

      // 4. Check if there exists a Grantee role in the circle
      if (!Object.keys(circle.roles).includes('grantee')) {
        await this.commandBus.execute(
          new AddRoleCommand(
            {
              name: 'Grantee',
              description:
                'This role is awarded to the grantees who have been accepted for the grants program',
              mutable: false,
              selfAssignable: false,
              permissions: defaultCircleRoles?.['applicant'].permissions,
            },
            circle,
            id,
          ),
        );
      }

      // 5. Add Automations
      const automations = getAutomations(
        id,
        grantee.id,
        grantee.slug,
        milestone.id,
        milestone.slug,
        onboardingForm.slug,
        templateDto.roles,
        templateDto.channelCategory,
      );

      for (const i in automations) {
        await this.commandBus.execute(
          new AddAutomationCommand(id, automations?.[i] as any),
        );
      }

      // 6. Create a Folder
      await this.commandBus.execute(
        new CreateFolderCommand(id, {
          name: 'Grants Workflow',
          avatar: 'Grants Workflow',
          contentIds: [onboardingForm.id, milestone.id, grantee.id],
        }),
      );

      // 7. Update the circle
      const updatedCircle = await this.commandBus.execute(
        new UpdateCircleCommand(
          id,
          {
            collections: [
              ...(circle.collections || []),
              onboardingForm.id,
              milestone.id,
              grantee.id,
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

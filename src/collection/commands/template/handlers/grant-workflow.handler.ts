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
import { AddAutomationCommand } from 'src/circle/commands/automation/impl';
import {
  getGranteeCollectionDto,
  getMilestoneCollectionDetails,
  getOnboardingFormDetails,
} from '../constants';
import { getAutomations } from '../constants/onboardingForm';

@CommandHandler(CreateGrantWorkflowCommand)
export class CreateGrantWorkflowCommandHandler
  implements ICommandHandler<CreateGrantWorkflowCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(CreateGrantWorkflowCommandHandler.name);
  }

  async execute(command: CreateGrantWorkflowCommand): Promise<Circle> {
    try {
      const { id, templateDto, caller } = command;
      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(id, {}),
      );

      // Create Onboarding Form
      const onboardingformDetails = getOnboardingFormDetails(circle);
      const onboardingForm = await this.collectionRepository.create({
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        ...onboardingformDetails,
      } as any);

      // Create Milestone Collection
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

      // Create Grantee Collection
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

      // Add Automations
      const automations = getAutomations(
        id,
        grantee.id,
        grantee.slug,
        milestone.id,
        milestone.slug,
        onboardingForm.slug,
      );

      for (const i in automations) {
        await this.commandBus.execute(
          new AddAutomationCommand(id, automations?.[i] as any),
        );
      }

      // Create a Folder
      await this.commandBus.execute(
        new CreateFolderCommand(id, {
          name: 'Grants Workflow',
          avatar: 'Grants Workflow',
          contentIds: [onboardingForm.id, milestone.id, grantee.id],
        }),
      );

      // Update the circle
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

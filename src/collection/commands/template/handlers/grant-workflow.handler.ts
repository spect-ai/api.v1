import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { LoggingService } from 'src/logging/logging.service';
import { CreateGrantWorkflowCommand } from '../impl/index';
import { v4 as uuidv4 } from 'uuid';
import { CollectionRepository } from 'src/collection/collection.repository';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { CreateCollectionCommand } from 'src/collection/commands';
import {
  granteeCollectionProperties,
  granteeCollectionPropertyOrder,
  milestoneProperties,
  milestonePropertyOrder,
  onboardingFormProperties,
  onboardingFormPropertyOrder,
} from 'src/collection/constants/grant-workflow';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { CreateFolderCommand } from 'src/circle/commands/impl';

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

  async execute(command: CreateGrantWorkflowCommand): Promise<void> {
    try {
      const { id, templateDto, caller } = command;
      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(id, {}),
      );

      const defaultPermissions = {
        manageSettings: [],
        updateResponsesManually: [],
        viewResponses: [],
        addComments: [],
      };

      Object.keys(circle.roles).map((role) => {
        if (circle.roles[role].permissions.createNewForm) {
          defaultPermissions.manageSettings.push(role);
          defaultPermissions.updateResponsesManually.push(role);
          defaultPermissions.viewResponses.push(role);
          defaultPermissions.addComments.push(role);
        }
      });

      const defaultViewId = '0x0';

      // Create Onboarding Form
      const onboardingForm = await this.collectionRepository.create({
        name: 'Grants Onboarding Form',
        collectionType: 0,
        description: ' ',
        properties: onboardingFormProperties,
        propertyOrder: onboardingFormPropertyOrder,
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        permissions: defaultPermissions,
        formMetadata: {
          active: true,
          logo: circle.avatar,
          messageOnSubmission: 'Thank you for submitting your response',
          multipleResponsesAllowed: false,
          updatingResponseAllowed: false,
        },
        projectMetadata: {
          viewOrder: [defaultViewId],
          views: {
            [defaultViewId]: {
              id: defaultViewId,
              name: 'Default View',
              type: 'form',
              filters: [],
              sort: {
                property: '',
                direction: 'asc',
              },
            },
          },
          cardOrders: {},
        },
      });

      // Create Milestone Collection
      const milstoneViewId = uuidv4();
      const milestone = await this.collectionRepository.create({
        name: 'Milestones',
        collectionType: 1,
        description: ' ',
        properties: milestoneProperties,
        propertyOrder: milestonePropertyOrder,
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        permissions: defaultPermissions,
        projectMetadata: {
          views: {
            [defaultViewId]: {
              id: defaultViewId,
              name: 'Default View',
              type: 'grid',
              filters: [],
              sort: {
                property: '',
                direction: 'asc',
              },
            },
            [milstoneViewId]: {
              id: milstoneViewId,
              name: 'Milestones',
              type: 'kanban',
              groupByColumn: 'Status',
              filters: [],
              sort: {
                property: '',
                direction: 'asc',
              },
            },
          },
          viewOrder: [milstoneViewId, '0x0'],
          cardOrders: {
            Status: [[], [], [], []],
          },
        },
      });

      // Create Grantee Collection
      const granteeViewId = uuidv4();
      const grantee = await this.collectionRepository.create({
        name: 'Grantee',
        collectionType: 1,
        description: ' ',
        properties: granteeCollectionProperties,
        propertyOrder: granteeCollectionPropertyOrder,
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        permissions: defaultPermissions,
        projectMetadata: {
          views: {
            [defaultViewId]: {
              id: defaultViewId,
              name: 'Default View',
              type: 'grid',
              filters: [],
              sort: {
                property: '',
                direction: 'asc',
              },
            },
            [granteeViewId]: {
              id: granteeViewId,
              name: 'Status View',
              type: 'kanban',
              groupByColumn: 'Status',
              filters: [],
              sort: {
                property: '',
                direction: 'asc',
              },
            },
          },
          viewOrder: [granteeViewId, '0x0'],
          cardOrders: {
            Status: [[], [], [], []],
          },
          payments: {
            rewardField: 'Total Reward',
            payeeField: 'Assignee',
          },
        },
      });

      // Create a Folder
      await this.commandBus.execute(
        new CreateFolderCommand(id, {
          name: 'Grants Workflow 4',
          avatar: 'Grants Workflow',
          contentIds: [onboardingForm.id, milestone.id, grantee.id],
        }),
      );

      // Update the circle
      await this.commandBus.execute(
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
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}

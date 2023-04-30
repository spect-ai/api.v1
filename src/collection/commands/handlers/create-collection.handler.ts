import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { CreateCollectionCommand } from '../impl/create-collection.command';
import { v4 as uuidv4 } from 'uuid';
import { MappedItem } from 'src/common/interfaces';
import { Permissions, Property } from 'src/collection/types/types';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CollectionCreatedEvent } from 'src/collection/events';
import { Circle } from 'src/circle/model/circle.model';

@CommandHandler(CreateCollectionCommand)
export class CreateCollectionCommandHandler
  implements ICommandHandler<CreateCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreateCollectionCommandHandler');
  }

  async execute(command: CreateCollectionCommand): Promise<Collection> {
    try {
      const { createCollectionDto, caller } = command;

      const formPropertyOrder = [uuidv4(), uuidv4(), uuidv4()];

      const formProperties = {
        [formPropertyOrder[0]]: {
          id: formPropertyOrder[0],
          name: 'What is your name?',
          type: 'shortText',
          default: '',
          isPartOfFormView: true,
          immutable: true,
        },
        [formPropertyOrder[1]]: {
          id: formPropertyOrder[1],
          name: 'Why do you want to join our team?',
          type: 'longText',
          default: '',
          isPartOfFormView: true,
        },
        [formPropertyOrder[2]]: {
          id: formPropertyOrder[2],
          name: 'Status',
          type: 'singleSelect',
          default: {},
          options: [
            {
              label: 'To Do',
              value: uuidv4(),
            },
            {
              label: 'In Progress',
              value: uuidv4(),
            },
            {
              label: 'Done',
              value: uuidv4(),
            },
          ],
          isPartOfFormView: false,
        },
      } as MappedItem<Property>;

      const projectPropertyOrder = ['Title', 'Description', uuidv4()];

      const projectProperties = {
        [projectPropertyOrder[0]]: {
          id: projectPropertyOrder[0],
          name: 'Title',
          type: 'shortText',
          default: '',
          isPartOfFormView: true,
          immutable: true,
        },
        [projectPropertyOrder[1]]: {
          id: projectPropertyOrder[1],
          name: 'Description',
          type: 'longText',
          default: '',
          isPartOfFormView: true,
        },
        [projectPropertyOrder[2]]: {
          id: projectPropertyOrder[2],
          name: 'Status',
          type: 'singleSelect',
          default: {},
          options: [
            {
              label: 'To Do',
              value: uuidv4(),
            },
            {
              label: 'In Progress',
              value: uuidv4(),
            },
            {
              label: 'Done',
              value: uuidv4(),
            },
          ],
          isPartOfFormView: false,
        },
      } as MappedItem<Property>;

      const parentCircle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(createCollectionDto.circleId, {}),
      );

      if (!parentCircle)
        throw `Circle with id ${createCollectionDto.circleId} not found`;

      let createdCollection;

      // give default permissions to roles which have createForm permission
      const defaultPermissions: Permissions = {
        manageSettings: [],
        updateResponsesManually: [],
        viewResponses: [],
        addComments: [],
      };

      Object.keys(parentCircle.roles).map((role) => {
        if (parentCircle.roles[role].permissions.createNewForm) {
          defaultPermissions.manageSettings.push(role);
          defaultPermissions.updateResponsesManually.push(role);
          defaultPermissions.viewResponses.push(role);
          defaultPermissions.addComments.push(role);
        }
      });

      if (createCollectionDto.collectionType === 0) {
        const defaultViewId = '0x0';
        createdCollection = await this.collectionRepository.create({
          ...createCollectionDto,
          // properties: formProperties,
          // propertyOrder: formPropertyOrder,
          creator: caller,
          parents: [createCollectionDto.circleId],
          slug: uuidv4(),
          permissions: defaultPermissions,
          formMetadata: {
            active: true,
            logo: parentCircle.avatar,
            messageOnSubmission: 'Thank you for submitting your response.',
            multipleResponsesAllowed: false,
            updatingResponseAllowed: false,
            allowAnonymousResponses: true,
            walletConnectionRequired: false,
            version: 1,
            pages: {
              start: {
                id: 'start',
                name: 'Welcome Page',
                properties: [],
              },
              'page-1': {
                id: 'page-1',
                name: 'Page 1',
                properties: [
                  // 'What is your name?',
                  // 'Why do you want to join our team?',
                  // 'Status',
                ],
                movable: true,
              },
              submitted: {
                id: 'submitted',
                name: 'Submitted',
                properties: [],
              },
            },
            pageOrder: ['start', 'page-1', 'submitted'],
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
      } else if (createCollectionDto.collectionType === 1) {
        const defaultViewId = '0x0';
        createdCollection = await this.collectionRepository.create({
          ...createCollectionDto,
          properties: projectProperties,
          propertyOrder: projectPropertyOrder,
          creator: caller,
          parents: [createCollectionDto.circleId],
          slug: uuidv4(),
          permissions: defaultPermissions,
          projectMetadata: {
            viewOrder: [defaultViewId],
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
            },
            cardOrders: {},
          },
        });
      }

      await this.commandBus.execute(
        new UpdateCircleCommand(
          parentCircle.id,
          {
            collections: [
              ...(parentCircle.collections || []),
              createdCollection.id,
            ],
          },
          caller,
        ),
      );

      this.eventBus.publish(
        new CollectionCreatedEvent(createdCollection, caller),
      );

      return createdCollection;
    } catch (err) {
      this.logger.error(`Failed creating collection with error ${err.message}`);
      throw new InternalServerErrorException(
        `Failed creating collection with error ${err.message}`,
      );
    }
  }
}

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
import { Property } from 'src/collection/types/types';
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

      const properties = {
        Title: {
          name: 'Title',
          type: 'shortText',
          default: '',
          isPartOfFormView: true,
          immutable: true,
        },
        Description: {
          name: 'Description',
          type: 'longText',
          default: '',
          isPartOfFormView: true,
        },
        Status: {
          name: 'Status',
          type: 'singleSelect',
          default: {},
          options: [
            {
              label: 'To Do',
              value: 'To Do',
            },
            {
              label: 'In Progress',
              value: 'In Progress',
            },
            {
              label: 'Done',
              value: 'Done',
            },
          ],
          isPartOfFormView: true,
        },
      } as MappedItem<Property>;
      const propertyOrder = ['Title', 'Description', 'Status'];

      const parentCircle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(createCollectionDto.circleId, {}),
      );

      if (!parentCircle)
        throw `Circle with id ${createCollectionDto.circleId} not found`;

      let createdCollection;

      if (createCollectionDto.collectionType === 0) {
        createdCollection = await this.collectionRepository.create({
          ...createCollectionDto,
          properties,
          propertyOrder,
          creator: caller,
          parents: [createCollectionDto.circleId],
          slug: uuidv4(),
          formMetadata: {
            active: true,
            logo: parentCircle.avatar,
            messageOnSubmission: 'Thank you for submitting your response',
            multipleResponsesAllowed: false,
            updatingResponseAllowed: false,
          },
        });
      } else if (createCollectionDto.collectionType === 1) {
        createdCollection = await this.collectionRepository.create({
          ...createCollectionDto,
          properties,
          propertyOrder,
          creator: caller,
          parents: [createCollectionDto.circleId],
          slug: uuidv4(),
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

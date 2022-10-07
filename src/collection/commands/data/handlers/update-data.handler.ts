import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { AddDataCommand } from '../impl/add-data.command';
import { v4 as uuidv4 } from 'uuid';
import { UpdateDataCommand } from '../impl/update-data.command';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { DataUpatedEvent } from 'src/collection/events';

@CommandHandler(UpdateDataCommand)
export class UpdateDataCommandHandler
  implements ICommandHandler<UpdateDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
  ) {
    this.logger.setContext('UpdateDataCommandHandler');
  }

  async execute(command: UpdateDataCommand) {
    const { data, caller, collectionId, dataSlug } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      const validData = await this.validationService.validate(data, collection);
      if (!validData) {
        throw new Error(`Data invalid`);
      }
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: {
            ...collection.data,
            [dataSlug]: {
              ...collection.data[dataSlug],
              ...data,
            },
          },
        },
      );
      this.eventBus.publish(
        new DataUpatedEvent(
          collection,
          data,
          caller,
          collection.data[dataSlug],
        ),
      );
      return updatedCollection;
    } catch (err) {
      this.logger.error(
        `Failed updating data in collection with collection Id ${collectionId} with error ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Failed updating data in collection to collection Id ${collectionId} with error ${err.message}`,
      );
    }
  }
}

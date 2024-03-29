import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RemovePropertyCommand } from '../impl/remove-property.command';

@CommandHandler(RemovePropertyCommand)
export class RemovePropertyCommandHandler
  implements ICommandHandler<RemovePropertyCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('RemovePropertyCommandHandler');
  }

  async execute(command: RemovePropertyCommand): Promise<Collection> {
    try {
      console.log('UpdatePropertyCommandHandler');
      const { collectionId, propertyId } = command;
      const collection = await this.collectionRepository.findById(collectionId);

      if (!collection.properties || !collection.properties[propertyId])
        throw `Cannot find property with id ${propertyId}`;

      delete collection.properties[propertyId];
      if (collection.propertyOrder)
        collection.propertyOrder.splice(
          collection.propertyOrder.indexOf(propertyId),
          1,
        );

      if (collection.data)
        for (const [id, data] of Object.entries(collection.data)) {
          delete data[propertyId];
        }

      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          properties: collection.properties,
          propertyOrder: collection.propertyOrder,
          data: collection.data,
        },
      );
      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(null, updatedCollection),
      );
    } catch (error) {
      this.logger.error(
        `Failed removing property to collection with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed removing property to collection with error: ${error.message}',
        error.message,
      );
    }
  }
}

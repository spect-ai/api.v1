import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { LoggingService } from 'src/logging/logging.service';
import { UpdatePropertyCommand } from '../impl/update-property.command';

@CommandHandler(UpdatePropertyCommand)
export class UpdatePropertyCommandHandler
  implements ICommandHandler<UpdatePropertyCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdatePropertyCommandHandler');
  }

  async execute(command: UpdatePropertyCommand): Promise<Collection> {
    try {
      console.log('UpdatePropertyCommandHandler');
      const { updatePropertyCommandDto, caller, collectionId, propertyId } =
        command;
      const collection = await this.collectionRepository.findById(collectionId);

      if (!collection.properties || !collection.properties[propertyId])
        throw `Cannot find property with id ${propertyId}`;

      let updatedCollection: Collection;
      if (updatePropertyCommandDto.name) {
        for (const [id, data] of Object.entries(collection.data)) {
          data[updatePropertyCommandDto.name] = data[propertyId];
          delete data[propertyId];
        }
        collection.properties[updatePropertyCommandDto.name] = {
          ...collection.properties[propertyId],
          ...updatePropertyCommandDto,
        };
        delete collection.properties[propertyId];
        const idx = collection.propertyOrder.indexOf(propertyId);
        console.log(idx);
        const propertyOrder = collection.propertyOrder.splice(
          idx,
          1,
          updatePropertyCommandDto.name,
        );

        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            properties: collection.properties,
            propertyOrder,
            data: collection.data,
          },
        );
      } else {
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            properties: {
              ...collection.properties,
              [propertyId]: {
                ...collection.properties[propertyId],
                ...updatePropertyCommandDto,
              },
            },
          },
        );
      }

      return updatedCollection;
    } catch (error) {
      this.logger.error(
        `Failed updating property to collection with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed updating property to collection with error: ${error.message}',
        error.message,
      );
    }
  }
}

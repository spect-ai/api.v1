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

      if (collection.collectionType === 1) {
        // remove any associated card orders
        if (
          collection.projectMetadata?.cardOrders &&
          collection.projectMetadata.cardOrders[propertyId]
        ) {
          delete collection.projectMetadata.cardOrders[propertyId];
        }

        // remove all views that use this property as a group by column
        if (collection.projectMetadata.viewOrder) {
          collection.projectMetadata.viewOrder =
            collection.projectMetadata.viewOrder.filter((v) => {
              if (
                collection.projectMetadata.views[v].groupByColumn === propertyId
              ) {
                delete collection.projectMetadata.views[v];
                return false;
              }
              return true;
            });
        }
      }

      // remove from all the pages
      if (collection.formMetadata?.pages) {
        for (const [id, page] of Object.entries(
          collection.formMetadata.pages,
        )) {
          if (page.properties) {
            page.properties = page.properties.filter((p) => p !== propertyId);
          }
        }
      }

      // remove from responseDataForMintKuods if present and respondeDataForPoap
      if (collection.formMetadata?.responseDataForMintkudos?.[propertyId]) {
        delete collection.formMetadata.responseDataForMintkudos[propertyId];
        collection.formMetadata.minimumNumberOfAnswersThatNeedToMatchForMintkudos -= 1;
      }
      if (collection.formMetadata?.responseDataForPoap?.[propertyId]) {
        delete collection.formMetadata.responseDataForPoap[propertyId];
        collection.formMetadata.minimumNumberOfAnswersThatNeedToMatchForPoap -= 1;
      }

      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          properties: collection.properties,
          propertyOrder: collection.propertyOrder,
          data: collection.data,
          projectMetadata: collection.projectMetadata,
          formMetadata: collection.formMetadata,
        },
      );
      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(updatedCollection.slug),
      );
    } catch (error) {
      this.logger.error(
        `Failed removing property to collection with error: ${error}`,
        command,
      );
      throw new InternalServerErrorException(
        `Failed removing property to collection with error: ${error}`,
        error.message,
      );
    }
  }
}

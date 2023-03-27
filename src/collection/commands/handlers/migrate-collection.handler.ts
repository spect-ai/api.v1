import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { MigrateAllCollectionsCommand } from '../impl/migrate-collection.command';

@CommandHandler(MigrateAllCollectionsCommand)
export class MigrateAllCollectionsCommandHandler
  implements ICommandHandler<MigrateAllCollectionsCommand>
{
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(command: MigrateAllCollectionsCommand) {
    const allCollections = await this.collectionRepository.findAll();

    for (const collection of allCollections) {
      if (
        collection.collectionType === 0 &&
        collection.formMetadata &&
        !collection.formMetadata.pages
      ) {
        const pages = {
          start: {
            id: 'start',
            name: 'Welcome Page',
            properties: [],
          },
          'page-1': {
            id: 'page-1',
            name: 'Page 1',
            properties: collection.propertyOrder,
            movable: true,
          },
          submitted: {
            id: 'submitted',
            name: 'Submitted',
            properties: [],
          },
        };
        const pageOrder = ['start', 'page-1', 'submitted'];

        pages['connect'] = {
          id: 'connect',
          name: 'Connect Wallet',
          properties: [],
        };
        pageOrder.splice(1, 0, 'connect');

        if (
          collection.formMetadata.poapEventId ||
          collection.formMetadata.surveyTokenId ||
          collection.formMetadata.mintkudosTokenId
        ) {
          pages['collect'] = {
            id: 'collect',
            name: 'Collect Incentives',
            properties: [],
          };
          pageOrder.splice(-1, 0, 'collect');
        }

        collection.formMetadata.pages = pages;
        collection.formMetadata.pageOrder = pageOrder;
        collection.formMetadata.allowAnonymousResponses = false;
      }
      await this.collectionRepository.updateById(collection.id, collection);
    }

    return true;
  }
}

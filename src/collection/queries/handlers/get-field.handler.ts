import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { HasSatisfiedDataConditionsQuery } from 'src/automation/queries/impl';
import { Collection } from 'src/collection/model/collection.model';
import { LoggingService } from 'src/logging/logging.service';
import {
  GetCollectionByFilterQuery,
  GetCollectionBySlugQuery,
} from '../impl/get-collection.query';
import { GetNextFieldQuery } from '../impl/get-field.query';

@QueryHandler(GetNextFieldQuery)
export class GetNextFieldQueryHandler
  implements IQueryHandler<GetNextFieldQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('GetNextFieldQueryHandler');
  }

  async fetchNextValidFieldFromCollection(
    collection: Collection,
    draftSubmittedByUser: object,
  ) {
    const { properties, propertyOrder } = collection;

    for (const page of collection.formMetadata.pageOrder) {
      for (const propertyId of collection.formMetadata.pages[page].properties) {
        const property = properties[propertyId];
        if (draftSubmittedByUser[propertyId]) {
          continue;
        } else if (property.viewConditions) {
          const viewConditions = property.viewConditions;
          const satisfied = await this.queryBus.execute(
            new HasSatisfiedDataConditionsQuery(
              collection,
              draftSubmittedByUser,
              viewConditions,
            ),
          );
          if (satisfied) {
            return propertyId;
          }
        } else return propertyId;
      }
    }

    return null;
  }

  async execute(query: GetNextFieldQuery): Promise<any> {
    const {
      slug,
      collection: collectionToFetch,
      callerId,
      discordChannelId,
      callerIdType,
    } = query;
    try {
      let collection = collectionToFetch;
      if (!collection && slug) {
        collection = await this.queryBus.execute(
          new GetCollectionBySlugQuery(slug),
        );
      }
      if (!collection && discordChannelId) {
        collection = await this.queryBus.execute(
          new GetCollectionByFilterQuery({
            'collectionLevelDiscordThreadRef.threadId': discordChannelId,
          }),
        );
      }
      if (!collection) {
        throw new NotFoundException('Collection not found');
      }
      const draftSubmittedByUser =
        collection.formMetadata.drafts &&
        collection.formMetadata.drafts[callerId];
      if (!draftSubmittedByUser) {
        return collection.properties[collection.propertyOrder[0]];
      }
      const nextField = await this.fetchNextValidFieldFromCollection(
        collection,
        draftSubmittedByUser,
      );
      if (nextField) {
        return collection.properties[nextField];
      }
      return null;
    } catch (err) {
      this.logger.logError('Error in GetNextFieldQueryHandler', err);
      throw err;
    }
  }
}

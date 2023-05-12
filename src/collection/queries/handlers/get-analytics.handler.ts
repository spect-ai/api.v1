import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetFormAnalyticsBySlugQuery,
  GetResponseMetricsQuery,
} from '../impl/get-analytics.query';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';

@QueryHandler(GetFormAnalyticsBySlugQuery)
export class GetFormAnalyticsBySlugQueryHandler
  implements IQueryHandler<GetFormAnalyticsBySlugQuery>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetCollectionByIdQueryHandler');
  }

  async execute(query: GetFormAnalyticsBySlugQuery) {
    try {
      const collection = await this.collectionRepository.getCollectionBySlug(
        query.slug,
      );
      // only send form metadata
      const { formMetadata, data, properties, name } = collection;

      return {
        formMetadata,
        data,
        properties,
        name,
      };
    } catch (error) {
      this.logger.error(
        `Failed while getting collection using id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting collection using id',
        error.message,
      );
    }
  }
}

@QueryHandler(GetResponseMetricsQuery)
export class GetResponseMetricsQueryHandler
  implements IQueryHandler<GetResponseMetricsQuery>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetResponseMetricsQueryHandler');
  }

  async execute(query: GetResponseMetricsQuery) {
    try {
      const collection = await this.collectionRepository.findById(query.id);
      // only send form metadata
      const { formMetadata } = collection;
      let averageTimeSpent = 0;
      if (formMetadata.totalTimeSpentMetricsOnPage) {
        let totalTimeSpent = 0;
        for (const [key, value] of Object.entries(
          formMetadata.totalTimeSpentMetricsOnPage || {},
        )) {
          totalTimeSpent += value;
        }
        averageTimeSpent =
          totalTimeSpent /
          Object.keys(formMetadata.totalTimeSpentMetricsOnPage).length;
      }

      const totalViews = formMetadata.pageVisitMetricsForAllUser['start'];
      const totalSubmitted = Object.keys(collection.data || {})?.length || 0;
      const completionRate = (totalSubmitted / totalViews) * 100;

      let pageId;
      for (const p of collection.formMetadata.pageOrder) {
        if (['start', 'connect', 'connectDiscord'].includes(p)) continue;
        pageId = p;
        break;
      }
      const totalStarted =
        collection.formMetadata.pageVisitMetricsForAllUser[pageId] || 0;

      let averageTimeSpentOnPage = {};
      if (formMetadata.totalTimeSpentMetricsOnPage) {
        for (const [key, value] of Object.entries(
          formMetadata.totalTimeSpentMetricsOnPage || {},
        )) {
          averageTimeSpentOnPage = {
            ...averageTimeSpentOnPage,
            [key]: value / totalSubmitted,
          };
        }
      }

      return {
        averageTimeSpent,
        totalViews,
        totalStarted,
        totalSubmitted,
        completionRate,
        totalTimeSpentMetricsOnPage: formMetadata.totalTimeSpentMetricsOnPage,
        pageVisitMetricsForAllUser: formMetadata.pageVisitMetricsForAllUser,
        averageTimeSpentOnPage,
      };
    } catch (error) {
      this.logger.error(
        `Failed while getting response metrics using id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(error);
    }
  }
}

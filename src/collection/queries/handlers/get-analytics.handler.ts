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
      const averageTimeSpent = 0;

      let pageId;
      for (const p of collection.formMetadata.pageOrder) {
        if (['start', 'connect', 'connectDiscord'].includes(p)) continue;
        pageId = p;
        break;
      }
      const totalStarted =
        collection.formMetadata.pageVisitMetricsForAllUser?.[pageId] || 0;
      const totalViews =
        formMetadata.pageVisitMetricsForAllUser?.['start'] || 0;
      const totalSubmitted = Object.keys(collection.data || {})?.length || 0;
      const completionRate = (totalSubmitted / totalStarted) * 100;

      console.log({ a: formMetadata.totalTimeSpentMetricsOnPage });

      const dropOffRate = formMetadata.pageOrder.reduce((acc, pageId) => {
        acc[pageId] = 0;
        return acc;
      }, {});
      console.log({ f: formMetadata.pageVisitMetricsByUser });
      for (const [userIp, pageIds] of Object.entries(
        formMetadata.pageVisitMetricsByUser,
      )) {
        const lastPage = pageIds[pageIds.length - 1];
        if (lastPage !== 'submitted') {
          dropOffRate[lastPage] = dropOffRate[lastPage] + 1;
        }
      }

      return {
        averageTimeSpent,
        totalViews,
        totalStarted,
        totalSubmitted,
        completionRate,
        pageVisitMetricsForAllUser: formMetadata.pageVisitMetricsForAllUser,
        dropOffRate,
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

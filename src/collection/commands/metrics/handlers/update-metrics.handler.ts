import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UpdatePageVisitMetricsCommand,
  UpdateTimeSpentMetricsCommand,
} from '../impl/update-metrics.command';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';

@CommandHandler(UpdatePageVisitMetricsCommand)
export class UpdatePageVisitMetricsCommandHandler
  implements ICommandHandler<UpdatePageVisitMetricsCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdatePageVisitMetricsCommandHandler');
  }

  async execute(command: UpdatePageVisitMetricsCommand): Promise<any> {
    try {
      const { collectionId, updatePageVisitMetricsDto, callerIp } = command;
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw `Collection with id ${collectionId} not found`;
      const formMetadata = collection.formMetadata;
      formMetadata.pageVisitMetricsForAllUser = {
        ...(formMetadata.pageVisitMetricsForAllUser || {}),
        [updatePageVisitMetricsDto.pageId]:
          (formMetadata.pageVisitMetricsForAllUser?.[
            updatePageVisitMetricsDto.pageId
          ] || 0) + 1,
      };
      if (
        !formMetadata.pageVisitMetricsByUser?.[callerIp]?.includes(
          updatePageVisitMetricsDto.pageId,
        )
      ) {
        if (!formMetadata.pageVisitMetricsByUser?.[callerIp]) {
          formMetadata.pageVisitMetricsByUser = {
            ...(formMetadata.pageVisitMetricsByUser || {}),
            [callerIp]: [],
          };
        }

        formMetadata.pageVisitMetricsByUser[callerIp].push(
          updatePageVisitMetricsDto.pageId,
        );
        formMetadata.pageVisitMetricsForUniqueUser = {
          ...(formMetadata.pageVisitMetricsForUniqueUser || {}),
          [updatePageVisitMetricsDto.pageId]:
            (formMetadata.pageVisitMetricsForUniqueUser?.[
              updatePageVisitMetricsDto.pageId
            ] || 0) + 1,
        };
      }
      await this.collectionRepository.updateById(collectionId, {
        formMetadata,
      });
      return;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}

@CommandHandler(UpdateTimeSpentMetricsCommand)
export class UpdateTimeSpentMetricsCommandHandler
  implements ICommandHandler<UpdateTimeSpentMetricsCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateTimeSpentMetricsCommandHandler');
  }

  async execute(command: UpdateTimeSpentMetricsCommand): Promise<any> {
    try {
      const { collectionId, updateTimeSpentMetricsDto } = command;
      console.log({ updateTimeSpentMetricsDto });
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw `Collection with id ${collectionId} not found`;
      const formMetadata = collection.formMetadata;

      if (updateTimeSpentMetricsDto.type === 'page') {
        for (const [pageId, timeSpent] of Object.entries(
          updateTimeSpentMetricsDto.timeSpent,
        )) {
          console.log({
            pageId,
            timeSpent,
            prevTimeSpent: formMetadata.totalTimeSpentMetricsOnPage?.[pageId],
          });
          formMetadata.totalTimeSpentMetricsOnPage = {
            ...(formMetadata.totalTimeSpentMetricsOnPage || {}),
            [pageId]:
              (formMetadata.totalTimeSpentMetricsOnPage?.[pageId] || 0) +
              timeSpent,
          };
        }
        await this.collectionRepository.updateById(collectionId, {
          formMetadata,
        });
      }
      return;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}

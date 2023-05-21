import {
  UpdatePageVisitMetricsDto,
  UpdateTimeSpentMetricsDto,
} from 'src/collection/dto/update-metrics.dto';

export class UpdatePageVisitMetricsCommand {
  constructor(
    public readonly collectionId: string,
    public readonly updatePageVisitMetricsDto: UpdatePageVisitMetricsDto,
    public readonly callerIp: string,
  ) {}
}

export class UpdateTimeSpentMetricsCommand {
  constructor(
    public readonly collectionId: string,
    public readonly updateTimeSpentMetricsDto: UpdateTimeSpentMetricsDto,
  ) {}
}

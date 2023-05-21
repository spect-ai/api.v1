import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class UpdatePageVisitMetricsDto {
  @IsString()
  @IsNotEmpty()
  readonly pageId: string;
}

export class UpdateTimeSpentMetricsDto {
  @IsString()
  @IsNotEmpty()
  readonly type: 'page' | 'field';

  @IsObject()
  @IsNotEmpty()
  readonly timeSpent: {
    [key: string]: number;
  };
}

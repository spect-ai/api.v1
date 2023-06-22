import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateSubscriptionToEventDto {
  @IsString()
  @IsNotEmpty()
  eventName: 'dataAdded' | 'dataUpdated' | 'dataDeleted';

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsObject()
  @IsOptional()
  headers?: {
    [key: string]: string;
  };

  @IsString()
  @IsOptional()
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  @IsObject()
  @IsOptional()
  body?: BodyInit;

  @IsObject()
  @IsOptional()
  params?: {
    [key: string]: string;
  };

  @IsObject()
  @IsOptional()
  query?: {
    [key: string]: string;
  };
}

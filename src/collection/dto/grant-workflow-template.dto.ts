import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UseTemplateDto {
  /**
   * Name of the automation
   **/
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsOptional()
  roles?: {
    [key: string]: boolean;
  };

  @IsObject()
  @IsOptional()
  channelCategory?: {
    label: string;
    value: number;
  };

  @IsObject()
  @IsOptional()
  snapshot: {
    name: string;
    id: string;
    network: string;
    symbol: string;
  };

  @IsString()
  @IsOptional()
  permissions: string[];
}

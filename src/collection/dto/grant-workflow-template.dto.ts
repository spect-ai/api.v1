import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class TemplateIdDto {
  @IsNotEmpty()
  @IsString()
  templateId: string;
}

export class UseTemplateDto {
  @IsObject()
  @IsOptional()
  roles?: {
    [key: string]: boolean;
  };

  @IsObject()
  @IsOptional()
  channelCategory?: {
    label: string;
    value: string;
  };

  @IsObject()
  @IsOptional()
  snapshot?: {
    name: string;
    id: string;
    network: string;
    symbol: string;
  };

  @IsArray()
  @IsOptional()
  permissions?: string[];
}

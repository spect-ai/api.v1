import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Registry } from 'src/registry/model/registry.model';

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
  registry?: { [key: string]: Registry };
}

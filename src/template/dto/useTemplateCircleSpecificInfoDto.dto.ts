import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Option } from 'src/collection/types/types';

export class CircleSpecificInfo {
  roleIds?: string[];
  channel?: Option;
  category?: Option;
}

export class UseTemplateCircleSpecificInfoDto {
  @IsString()
  type: string;

  @IsString()
  id: string;

  @IsOptional()
  @IsBoolean()
  skip?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CircleSpecificInfo)
  info?: CircleSpecificInfo;
}

export class UseTemplateCircleSpecificInfoDtos {
  @IsOptional()
  @IsArray()
  useTemplateCircleSpecificInfoDtos?: UseTemplateCircleSpecificInfoDto[];
}

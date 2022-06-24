import { OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateCircleRequestDto } from './create-circle-request.dto';

export class UpdateCircleRequestDto extends OmitType(CreateCircleRequestDto, [
  'name',
  'parent',
] as const) {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  /**
   * The members of the circle
   */
  @IsArray()
  @IsOptional()
  members?: string[];

  /**
   * The roles of members of the circle
   */
  @IsArray()
  @IsOptional()
  memberRoles?: string[];

  /**
   * Circle is archived if true
   */
  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}

import { PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class CreateApplicationDto {
  /**
   * Application title
   */
  @IsString()
  @IsNotEmpty()
  title: string;
  /**
   * Application content
   */
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateApplicationDto {
  /**
   * Application title
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title: string;
  /**
   * Application content
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content: string;
}

export class PickApplicationDto {
  /**
   * Array of applications to pick
   */
  @IsArray()
  @IsNotEmpty()
  applicationIds: string[];
}

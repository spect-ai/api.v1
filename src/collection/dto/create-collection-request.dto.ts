import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Property } from '../types/types';

export class CreateCollectionDto {
  /**
   * The name collection
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Private collection
   */
  @IsBoolean()
  @IsOptional()
  private: boolean;

  /**
   * The purpose of creating this collection
   */
  @IsString()
  @IsOptional()
  purpose: string;

  /**
   * The properties associated with the collection
   */
  @IsObject()
  @IsOptional()
  properties?: Property[];

  /**
   * The circle the collection belongs to
   */
  @IsString()
  @IsOptional()
  circleId?: string;
}

import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { Property } from '../types/types';

export class CreateCollectionDto {
  /**
   * The name collection
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The purpose of creating this collection
   */
  @IsString()
  @IsNotEmpty()
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

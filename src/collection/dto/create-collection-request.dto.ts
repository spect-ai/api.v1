import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { DefaultViewType, Property } from '../types/types';

export class CreateCollectionDto {
  /**
   * The name collection
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The circle the collection belongs to
   */
  @IsObjectId()
  @IsNotEmpty()
  circleId?: string;

  /**
   * Private collection
   */
  @IsBoolean()
  @IsOptional()
  private: boolean;

  /**
   * The description of creating this collection
   */
  @IsString()
  @IsOptional()
  description: string;

  /**
   * The properties associated with the collection
   */
  @IsObject()
  @IsOptional()
  properties?: Property[];

  /**
   * The default view of the collection
   */
  @IsString()
  @IsOptional()
  defaultView?: DefaultViewType;
}

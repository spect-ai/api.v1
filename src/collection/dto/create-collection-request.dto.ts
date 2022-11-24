import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { DefaultViewType } from '../types/types';

export class CreateCollectionDto {
  /**
   * The name collection
   * @example "My Collection"
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The circle the collection belongs to
   * @example "5f7e9b9b9b9b9b9b9b9b9b9b"
   */
  @IsObjectId()
  @IsNotEmpty()
  circleId?: string;
  /**
   * Private collection
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  privateResponses: boolean;

  /**
   * The description of creating this collection
   * @example "This collection is created to track the progress of the project"
   */
  @IsString()
  @IsOptional()
  description: string;

  /**
   * The default view of the collection
   * @example "form"
   */
  @IsString()
  @IsOptional()
  defaultView?: DefaultViewType;

  /**
   * The default view of the collection
   * @example "form"
   */
  @IsNumber()
  collectionType: 0 | 1;
}

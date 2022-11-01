import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { DefaultViewType } from '../types/types';

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
  privateResponses: boolean;

  /**
   * The description of creating this collection
   */
  @IsString()
  @IsOptional()
  description: string;

  /**
   * The default view of the collection
   */
  @IsString()
  @IsOptional()
  defaultView?: DefaultViewType;
}

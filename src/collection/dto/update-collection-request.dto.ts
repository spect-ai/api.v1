import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCollectionDto {
  /**
   * The name collection
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * The purpose of creating this collection
   */
  @IsString()
  @IsOptional()
  purpose?: string;
}

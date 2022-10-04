import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCollectionDto {
  /**
   * The name collection
   */
  @IsString()
  @IsOptional()
  name?: string;
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
  description?: string;
}

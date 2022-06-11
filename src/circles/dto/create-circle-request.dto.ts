import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCircleRequestDto {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The description of the circle
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The parent circles of the circle
   */
  @IsArray()
  @IsOptional()
  parents?: string[];
}

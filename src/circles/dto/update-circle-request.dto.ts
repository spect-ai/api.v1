import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateCircleRequestDto {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  /**
   * The description of the circle
   */
  @IsString()
  @IsOptional()
  @IsOptional()
  description?: string;

  /**
   * The avatar of the circle
   */
  @IsString()
  @IsOptional()
  avatar?: string;

  /**
   * Circle is private or public
   */
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  /**
   * The website associated with the circle
   */
  @IsString()
  @IsOptional()
  website?: string;

  /**
   * The twitter account associated with the circle
   */
  @IsString()
  @IsOptional()
  twitter?: string;

  /**
   * The github account associated with the circle
   */
  @IsString()
  @IsOptional()
  github?: string;

  /**
   * The email associated with the circle
   */
  @IsString()
  @IsOptional()
  email?: string;
}

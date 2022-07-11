import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProjectRequestDto {
  /**
   * The name of the project
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  /**
   * The description of the project
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Project is private or public
   */
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  /**
   * Array containing column order
   */
  @IsArray()
  @IsOptional()
  columnOrder?: string[];

  /**
   * Project is archived if true
   */
  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  /**
   * Channel in which discussion threads about cards in the circle will be posted
   */
  @IsOptional()
  discordDiscussionChannel: {
    id: string;
    name: string;
  };
}

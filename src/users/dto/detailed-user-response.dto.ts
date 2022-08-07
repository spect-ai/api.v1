import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class DetailedUserPubliceResponseDto {
  /**
   * The name of the user
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username: string;

  /**
   * The ethereum address of the user
   */
  @IsString()
  @IsNotEmpty()
  ethAddress: string;

  /**
   * The avatar of the user
   */
  @IsString()
  @IsOptional()
  avatar: string;

  @IsArray()
  @IsOptional()
  circles: string[];

  @IsArray()
  @IsOptional()
  projects: string[];

  @IsArray()
  @IsOptional()
  assignedCards: string[];

  @IsArray()
  @IsOptional()
  reviewingCards: string[];
}

export class DetailedUserPrivateResponseDto extends DetailedUserPubliceResponseDto {}

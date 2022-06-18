import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateColumnRequestDto {
  /**
   * The name of the column
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  /**
   * The name of the column
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  defaultCardType: 'Task' | 'Bounty';
}

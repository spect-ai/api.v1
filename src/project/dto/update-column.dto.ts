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

  /** Channel to which notifs are sent when cards are added to this column */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  notificationChannel?: string;
}

import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export type ColumnDetailsDto = {
  [key: string]: ColumnDetailDto;
};
export class ColumnDetailDto {
  /**
   * The id of the column
   */
  @IsString()
  @IsNotEmpty()
  columnId: string;
  /**
   * The name of the column
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The card Ids in the column
   */
  @IsString()
  @IsNotEmpty()
  cards: string[];

  /**
   * The default card type in the column, ie, task or bounty
   */
  @IsString()
  defaultCardType?: 'Task' | 'Bounty';

  /**
   * The circle level role access to take various actions in the column
   */
  @IsObject()
  access: Actions;

  /** Channel to which notifs are sent when cards are added to this column */
  @IsString()
  @IsOptional()
  notificationChannel?: string;
}

export type Actions = {
  canCreateCard: string; // action pointing to a circle level role
};

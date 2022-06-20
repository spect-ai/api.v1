import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';
import { ObjectId } from 'mongoose';

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
}

export type Actions = {
  canCreateCard: string; // action pointing to a circle level role
};

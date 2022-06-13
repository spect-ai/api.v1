import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ColumnDetailsDto {
  /**
   * The name of the column
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The name of the project
   */
  @IsString()
  @IsNotEmpty()
  cards: string[];

  /**
   * The default card type in the column, ie, task or bounty
   */
  @IsNumber()
  defaultCardType?: number;

  /**
   * The access to take various actions in the column
   */
  @IsArray()
  access: string[];
}

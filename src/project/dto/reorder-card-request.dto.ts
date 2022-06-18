import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ReorderCardReqestDto {
  /**
   * The name of the column
   */
  @IsString()
  @IsNotEmpty()
  destinationColumnId: string;

  /**
   * The card index at which the card is placed during reorder
   */
  @IsNumber()
  @IsNotEmpty()
  destinationCardIndex: number;
}

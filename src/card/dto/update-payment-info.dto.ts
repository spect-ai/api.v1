import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export type ReturnWith = {
  type: 'project' | 'circle' | 'card' | 'retro';
  id: string;
};

export class UpdatePaymentInfoDto {
  /**
   * Thread Id
   */
  @IsArray()
  @IsNotEmpty()
  cardIds: string[];
  /**
   * Thread Id
   */
  @IsString()
  @IsNotEmpty()
  transactionHash: string;

  /**
   * Return object
   */
  @IsObject()
  @IsOptional()
  returnWith?: ReturnWith;
}

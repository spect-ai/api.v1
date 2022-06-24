import { IsArray, IsNotEmpty, IsString } from 'class-validator';

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
}

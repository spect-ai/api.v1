import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class UpdatePaymentInfoDto {
  /**
   * Thread Id
   */
  @IsString()
  @IsNotEmpty()
  transactionHash: string;
}

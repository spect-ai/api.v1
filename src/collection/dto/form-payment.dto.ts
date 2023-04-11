import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { Option } from '../types/types';

export class FormPaymentDto {
  @IsNotEmpty()
  @IsObject()
  readonly chain: Option;

  @IsNotEmpty()
  @IsObject()
  readonly token: Option;

  @IsNotEmpty()
  @IsString()
  readonly value: string;

  @IsOptional()
  @IsString()
  readonly txnHash: string;
}

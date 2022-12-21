import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddPaymentsRequestDto {
  @IsString()
  @IsNotEmpty()
  collectionId: string;

  @IsArray()
  dataSlugs: string[];
}

export class CancelPaymentsDto {
  @IsString()
  @IsNotEmpty()
  collectionId: string;

  @IsString()
  @IsOptional()
  dataSlugs: string;

  @IsString()
  @IsOptional()
  cancellationReason: string;
}

export class MovePaymentsDto {
  @IsArray()
  @IsNotEmpty()
  paymentIds: string[];

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;
}

export class MakePaymentsRequestDto {
  @IsArray()
  @IsNotEmpty()
  paymentIds: string[];
}

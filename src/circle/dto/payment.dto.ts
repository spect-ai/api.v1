import {
  IsArray,
  IsNotEmpty,
  IsNumber,
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

export class UpdatePaymentRequestDto {
  @IsString()
  @IsOptional()
  type: 'Manually Added' | 'Added From Card';

  @IsObject()
  @IsOptional()
  chain: {
    label: string;
    value: string;
  };

  @IsObject()
  @IsOptional()
  token: {
    label: string;
    value: string;
  };

  @IsNumber()
  @IsOptional()
  value: number;

  @IsArray()
  @IsOptional()
  paidTo: {
    propertyType: string;
    value: any;
  }[];
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

export class PaymentIdsDto {
  @IsArray()
  @IsNotEmpty()
  paymentIds: string[];

  @IsObject()
  @IsOptional()
  transactionHash: { [key: string]: string };
}

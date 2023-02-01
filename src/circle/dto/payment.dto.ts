import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Option } from 'src/collection/types/types';

export class AddManualPaymentRequestDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  type: 'Manually Added' | 'Added From Card';

  @IsString()
  @IsOptional()
  collectionId: string;

  @IsObject()
  chain: {
    label: string;
    value: string;
  };

  @IsObject()
  token: {
    label: string;
    value: string;
  };

  @IsNumber()
  value: number;

  @IsArray()
  paidTo: {
    propertyType: string;
    value: any;
  }[];

  @IsArray()
  @IsOptional()
  labels: Option[];

  @IsObject()
  @IsOptional()
  collection?: {
    label: string;
    value: string;
  };

  @IsObject()
  @IsOptional()
  data?: {
    label: string;
    value: string;
  };
}

export class AddPaymentsRequestDto {
  @IsString()
  @IsNotEmpty()
  collectionId: string;

  @IsArray()
  dataSlugs: string[];
}

export class UpdatePaymentFromCardRequestDto {
  @IsString()
  @IsNotEmpty()
  collectionId: string;

  @IsString()
  dataSlug: string;
}

export class UpdatePaymentRequestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: 'Manually Added' | 'Added From Card';

  @IsObject()
  @IsOptional()
  chain?: {
    label: string;
    value: string;
  };

  @IsObject()
  @IsOptional()
  token?: {
    label: string;
    value: string;
  };

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsArray()
  @IsOptional()
  paidTo?: {
    propertyType: string;
    value: any;
  }[];

  @IsArray()
  @IsOptional()
  labels?: Option[];

  @IsString()
  @IsOptional()
  transactionHash?: string;

  @IsString()
  @IsOptional()
  safeTransactionHash?: string;

  @IsString()
  @IsOptional()
  status?: 'Pending' | 'Pending Signature' | 'Completed' | 'Cancelled';

  @IsObject()
  @IsOptional()
  collection?: {
    label: string;
    value: string;
  };

  @IsObject()
  @IsOptional()
  data?: {
    label: string;
    value: string;
  };
}

export class UpdateMultiplePaymentsDto extends UpdatePaymentRequestDto {
  @IsArray()
  @IsNotEmpty()
  paymentIds: string[];
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

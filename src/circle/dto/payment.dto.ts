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

// export class AddPaymentsDto {
//   @IsString()
//   @IsNotEmpty()
//   collectionId: string;

//   @IsObject()
//   @IsOptional()
//   dataSlugsToPaymentObj: {
//     [key: string]: {
//       rewardProperty: string[];
//       payToProperty: string[];
//       distributionStrategy: 'distributeEvenly' | 'distributeToFirstPerson';
//     };
//   };
// }

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

export class MakePaymentsDto {
  @IsString()
  @IsNotEmpty()
  collectionId: string;

  @IsString()
  @IsOptional()
  dataSlugs: string;
}

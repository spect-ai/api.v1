import {
  AddPaymentsRequestDto,
  UpdateMultiplePaymentsDto,
  UpdatePaymentRequestDto,
} from 'src/circle/dto/payment.dto';
import { Option } from 'src/collection/types/types';
import { User } from 'src/users/model/users.model';

export class UpdatePaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly paymentId: string,
    public readonly updatePaymentsDto: UpdatePaymentRequestDto,
    public readonly caller: User,
  ) {}
}

export class UpdateMultiplePaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly paymentIds: string[],
    public readonly updatePaymentsDto: UpdateMultiplePaymentsDto,
    public readonly caller: User,
  ) {}
}

export class UpdatePaymentFromCardCommand {
  constructor(
    public readonly circleId: string,
    public readonly paymentId: string,
    public readonly updatePaymentsDto: AddPaymentsRequestDto,
    public readonly caller: User,
  ) {}
}

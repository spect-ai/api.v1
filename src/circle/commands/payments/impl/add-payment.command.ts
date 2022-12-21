import { AddPaymentsRequestDto } from 'src/circle/dto/payment.dto';

export class AddPaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly addPaymentsDto: AddPaymentsRequestDto,
  ) {}
}

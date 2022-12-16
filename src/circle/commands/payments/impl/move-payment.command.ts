import { CancelPaymentsDto, MakePaymentsDto } from 'src/circle/dto/payment.dto';

export class CancelPaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly cancelPaymentsDto: CancelPaymentsDto,
  ) {}
}

export class MakePaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly cancelPaymentsDto: MakePaymentsDto,
  ) {}
}

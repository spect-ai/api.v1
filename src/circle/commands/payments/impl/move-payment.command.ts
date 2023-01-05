import { CancelPaymentsDto, MovePaymentsDto } from 'src/circle/dto/payment.dto';

export class CancelPaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly cancelPaymentsDto: CancelPaymentsDto,
  ) {}
}

export class MovePaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly movePaymentsDto: MovePaymentsDto,
    public readonly transactionHash?: { [key: string]: string },
  ) {}
}

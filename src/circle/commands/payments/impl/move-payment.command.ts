import { CancelPaymentsDto, MovePaymentsDto } from 'src/circle/dto/payment.dto';
import { User } from 'src/users/model/users.model';

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
    public readonly caller: User,
    public readonly transactionHash?: { [key: string]: string },
  ) {}
}

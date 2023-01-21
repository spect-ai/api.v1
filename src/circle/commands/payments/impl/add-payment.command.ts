import { AddPaymentsRequestDto } from 'src/circle/dto/payment.dto';
import { User } from 'src/users/model/users.model';

export class AddPaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly addPaymentsDto: AddPaymentsRequestDto,
    public readonly caller: User,
  ) {}
}

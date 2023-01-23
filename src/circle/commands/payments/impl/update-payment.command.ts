import { UpdatePaymentRequestDto } from 'src/circle/dto/payment.dto';
import { User } from 'src/users/model/users.model';

export class UpdatePaymentsCommand {
  constructor(
    public readonly circleId: string,
    public readonly paymentId: string,
    public readonly updatePaymentsDto: UpdatePaymentRequestDto,
    public readonly caller: User,
  ) {}
}

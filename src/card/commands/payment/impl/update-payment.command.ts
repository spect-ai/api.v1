import { UpdatePaymentInfoDto } from 'src/card/dto/update-payment-info.dto';

export class UpdatePaymentCommand {
  constructor(
    public readonly updatePaymentDto: UpdatePaymentInfoDto,
    public readonly caller: string,
  ) {}
}

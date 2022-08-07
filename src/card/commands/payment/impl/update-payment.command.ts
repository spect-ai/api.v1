import { UpdatePaymentInfoDto } from 'src/card/dto/update-payment-info.dto';
import { ExtendedCard } from 'src/card/model/card.model';

export class UpdatePaymentCommand {
  constructor(
    public readonly updatePaymentInfoDto: UpdatePaymentInfoDto,
    public readonly commit = true,
    public readonly objectify = false,
  ) {}
}

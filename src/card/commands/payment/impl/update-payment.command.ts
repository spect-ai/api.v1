import { FilterQuery } from 'mongoose';
import { Card } from 'src/card/model/card.model';

export class UpdatePaymentCommand {
  constructor(
    public readonly updatePaymentDto: UpdatePaymentInfoDto,
    public readonly caller: string,
    public readonly commit = true,
    public readonly objectify = false,
    public readonly filter?: FilterQuery<Card>,
    public readonly cards?: Card[],
  ) {}
}

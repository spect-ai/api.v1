import { FilterQuery } from 'mongoose';
import { Card } from 'src/card/model/card.model';

export class UpdatePaymentCommand {
  constructor(
    public readonly commit = true,
    public readonly objectify = false,
    public readonly filter?: FilterQuery<Card>,
    public readonly cards?: Card[],
  ) {}
}

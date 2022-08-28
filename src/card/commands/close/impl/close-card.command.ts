import { FilterQuery } from 'mongoose';
import { Card, ExtendedCard } from 'src/card/model/card.model';

export class CloseCardsCommand {
  constructor(
    public readonly caller: string,
    public readonly filter?: FilterQuery<Card>,
    public readonly cards?: ExtendedCard[],
  ) {}
}

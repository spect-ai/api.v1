import { ExtendedCard } from 'src/card/model/card.model';

export class ArchiveCardCommand {
  constructor(
    public readonly id?: string,
    public readonly card?: ExtendedCard,
  ) {}
}

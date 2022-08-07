import { ExtendedCard } from 'src/card/model/card.model';

export class RevertArchivedCardCommand {
  constructor(
    public readonly id?: string,
    public readonly card?: ExtendedCard,
  ) {}
}

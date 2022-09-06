import { ExtendedCard } from 'src/card/model/card.model';

export class ArchiveCardCommand {
  constructor(
    public readonly id?: string,
    public readonly card?: ExtendedCard,
  ) {}
}

export class ArchiveMultipleCardsByIdCommand {
  constructor(
    public readonly ids: string[],
    public readonly removeFromProject?: boolean,
  ) {}
}

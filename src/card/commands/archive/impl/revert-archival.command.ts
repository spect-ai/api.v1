import { ExtendedCard } from 'src/card/model/card.model';

export class RevertArchivedCardCommand {
  constructor(
    public readonly id?: string,
    public readonly card?: ExtendedCard,
  ) {}
}

export class RevertArchivalMultipleCardsByIdCommand {
  constructor(
    public readonly ids: string[],
    public readonly addToProject?: boolean,
  ) {}
}

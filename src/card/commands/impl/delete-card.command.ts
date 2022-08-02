import { Card } from 'src/card/model/card.model';

export class DeleteCardByIdCommand {
  constructor(
    public readonly id: string,
    public readonly deleteSubcards = true,
    public readonly deleteFromProject = true,
  ) {}
}

export class DeleteMultipleCardsByIdCommand {
  constructor(
    public readonly ids: string[],
    public readonly deleteSubcards = true,
    public readonly deleteFromProject = true,
  ) {}
}

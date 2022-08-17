import { Card } from 'src/card/model/card.model';
import { MappedItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';

export class AddCardsCommand {
  constructor(
    public readonly cards: Card[],
    public readonly project?: Project,
    public readonly id?: string,
  ) {}
}

export class AddCardsInMultipleProjectsCommand {
  constructor(public readonly projectIdToCards: MappedItem<Card[]>) {}
}

import { Card } from 'src/card/model/card.model';
import { Project } from 'src/project/model/project.model';

export class AddCardsCommand {
  constructor(
    public readonly cards: Card[],
    public readonly project: Project,
    public readonly caller: string,
  ) {}
}

import { Card, ExtendedCard } from 'src/card/model/card.model';
import { MappedItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';

export class PerformAutomationCommand {
  constructor(
    public readonly update: Partial<Card>,
    public readonly card: Card | ExtendedCard,
    public readonly project: Project,
  ) {}
}

export class PerformMultipleAutomationsCommand {
  constructor(
    public readonly updates: MappedItem<Partial<Card>>,
    public readonly cards: MappedItem<Card | ExtendedCard>,
    public readonly projects: MappedItem<Project>,
  ) {}
}

import { Automation } from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';
import { MappedItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';

export class GetTriggeredAutomationsQuery {
  constructor(
    public readonly card: Card,
    public readonly update: Partial<Card>,
    public readonly automations: Automation[],
  ) {}
}

export class GetTriggeredAutomationForMultipleCardsQuery {
  constructor(
    public readonly cards: Card[],
    public readonly updates: MappedItem<Partial<Card>>,
    public readonly projects: MappedItem<Project>,
  ) {}
}

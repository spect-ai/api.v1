import { PerformAutomationCommandContainer } from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { MappedItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';

export class PerformAutomationCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly caller: string,
  ) {}
}

export class PerformMultipleAutomationsCommand {
  constructor(
    public readonly updates: Partial<Card>[],
    public readonly cards: MappedItem<Card>,
    public readonly caller: string,
    public readonly cardIdToProject: MappedItem<Project>,
    public readonly cardIdToCircle?: MappedItem<Circle>,
    public readonly cardCreated?: boolean,
  ) {}
}

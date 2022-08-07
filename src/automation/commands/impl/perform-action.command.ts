import { Action } from 'src/automation/types/types';
import { Card, ExtendedCard } from 'src/card/model/card.model';
import { MappedItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';

export class PerformColumnChangeActionCommand {
  constructor(
    public readonly update: Partial<Card>,
    public readonly card: Card | ExtendedCard,
    public readonly project: Project,
  ) {}
}

export class PerformStatusUpdateCommand {
  constructor(
    public readonly update: Partial<Card>,
    public readonly card: Card | ExtendedCard,
    public readonly project: Project,
  ) {}
}

export class PerformChildCardActionCommand {
  constructor(
    public readonly update: Partial<Card>,
    public readonly card: Card | ExtendedCard,
    public readonly project: Project,
  ) {}
}

export class PerformActionsCommand {
  constructor(
    public readonly actions: Action[],
    public readonly card: Card | ExtendedCard,
    public readonly project: Project,
  ) {}
}

export class PerformSpecialActionsCommand {
  constructor(
    public readonly card: Card | ExtendedCard,
    public readonly project: Project,
  ) {}
}

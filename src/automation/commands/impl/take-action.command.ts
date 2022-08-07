import { Action } from 'src/automation/types/types';
import {
  ArchiveCardCommand,
  RevertArchivedCardCommand,
} from 'src/card/commands/impl';
import { Card, ExtendedCard } from 'src/card/model/card.model';
import { Project } from 'src/project/model/project.model';

export class ChangeStatusActionCommand {
  constructor(
    public readonly card: Card | ExtendedCard,
    public readonly action: Action,
  ) {}
}

export class ChangeMemberActionCommand {
  constructor(
    public readonly card: Card | ExtendedCard,
    public readonly action: Action,
  ) {}
}

export class ChangeLabelActionCommand {
  constructor(
    public readonly card: Card | ExtendedCard,
    public readonly action: Action,
  ) {}
}

export class ChangeSimpleFieldActionCommand {
  constructor(
    public readonly card: Card | ExtendedCard,
    public readonly action: Action,
  ) {}
}

export class ChangeColumnActionCommand {
  constructor(
    public readonly project: Project,
    public readonly card: Card | ExtendedCard,
    public readonly action: Action,
  ) {}
}

export class ChangeDeadlineActionCommand {
  constructor(
    public readonly card: Card | ExtendedCard,
    public readonly action: Action,
  ) {}
}

export const actionIdToCommandMap = {
  changeStatus: ChangeStatusActionCommand,
  changeColumn: ChangeColumnActionCommand,
  changePriority: ChangeSimpleFieldActionCommand,
  changeDeadline: ChangeDeadlineActionCommand,
  changeAssignee: ChangeMemberActionCommand,
  changeReviewer: ChangeMemberActionCommand,
  changeLabels: ChangeLabelActionCommand,
  changeType: ChangeSimpleFieldActionCommand,
  archive: ArchiveCardCommand,
  unarchive: RevertArchivedCardCommand,
};

import {
  Action,
  PerformAutomationCommandContainer,
} from 'src/automation/types/types';
import {
  ArchiveCardCommand,
  RevertArchivedCardCommand,
} from 'src/card/commands/impl';

export class TakeActionsCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly caller: string,
    public readonly actions: Action[],
  ) {}
}

export class ChangeStatusActionCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly action: Action,
    public readonly caller: string,
  ) {}
}

export class ChangeMemberActionCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly action: Action,
    public readonly caller: string,
  ) {}
}

export class ChangeLabelActionCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly action: Action,
    public readonly caller: string,
  ) {}
}

export class ChangeSimpleFieldActionCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly action: Action,
    public readonly caller: string,
  ) {}
}

export class ChangeColumnActionCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly action: Action,
    public readonly caller: string,
  ) {}
}

export class ChangeDeadlineActionCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly action: Action,
    public readonly caller: string,
  ) {}
}

export class CloseCardActionCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly action: Action,
    public readonly caller: string,
  ) {}
}

export class CloseParentCardActionCommand {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly action: Action,
    public readonly caller: string,
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
  close: CloseCardActionCommand,
  closeParentCard: CloseParentCardActionCommand,
};

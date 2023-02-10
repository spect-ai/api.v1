import {
  AutomationUpdatesContainer,
  DataContainer,
} from 'src/automation/types/types';
import { Circle } from 'src/circle/model/circle.model';
import { Action } from 'src/circle/types';
import { MappedItem } from 'src/common/interfaces';

export class ActionCommand {
  constructor(
    public readonly action: Action,
    public readonly caller: string,
    public readonly dataContainer: DataContainer,
    public readonly updatesContainer: AutomationUpdatesContainer,
    public readonly relevantIds: MappedItem<any>,
  ) {}
}

export class SendEmailActionCommand extends ActionCommand {}
export class GiveRoleActionCommand extends ActionCommand {}
export class GiveDiscordRoleActionCommand extends ActionCommand {}
export class CreateDiscordChannelActionCommand extends ActionCommand {}
export class CreateCardActionCommand extends ActionCommand {}
export class StartVotingPeriodActionCommand extends ActionCommand {}
export class PostOnDiscordActionCommand extends ActionCommand {}
export class CloseCardActionCommand extends ActionCommand {}

export const actionIdToCommandMapNew = {
  sendEmail: SendEmailActionCommand,
  giveRole: GiveRoleActionCommand,
  createDiscordChannel: CreateDiscordChannelActionCommand,
  giveDiscordRole: GiveDiscordRoleActionCommand,
  createCard: CreateCardActionCommand,
  startVotingPeriod: StartVotingPeriodActionCommand,
  postOnDiscord: PostOnDiscordActionCommand,
  closeCard: CloseCardActionCommand,
};

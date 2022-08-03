import { InviteToCircleCommandHandler } from '../membership/handlers/invite-to-circle.handler';
import {
  JoinUsingDiscordCommandHandler,
  JoinUsingInvitationCommandHandler,
} from '../membership/handlers/join-circle.handler';
import {
  RemoveProjectsCommandHandler,
  RemoveProjectsFromMultipleCirclesCommandHandler,
} from '../projects/handlers/remove-projects.handler';

export const CommandHandlers = [
  RemoveProjectsCommandHandler,
  RemoveProjectsFromMultipleCirclesCommandHandler,
  JoinUsingInvitationCommandHandler,
  JoinUsingDiscordCommandHandler,
  InviteToCircleCommandHandler,
];

import { UpdateMemberRolesCommandHandler } from '../membership/handlers/update-member-roles.handler';
import { InviteToCircleCommandHandler } from '../membership/handlers/invite-to-circle.handler';
import {
  JoinUsingDiscordCommandHandler,
  JoinUsingInvitationCommandHandler,
} from '../membership/handlers/join-circle.handler';
import { RemoveFromCircleCommandHandler } from '../membership/handlers/remove-from-circle.handler';
import {
  RemoveProjectsCommandHandler,
  RemoveProjectsFromMultipleCirclesCommandHandler,
} from '../projects/handlers/remove-projects.handler';
import { AddRoleCommandHandler } from '../roles/handlers/add-role.handler';
import { RemoveRoleCommandHandler } from '../roles/handlers/remove-role.handler';
import { UpdateRoleCommandHandler } from '../roles/handlers/update-role.handler';
import { CreateCircleCommandHandler } from './create-circle.handler';

export const CommandHandlers = [
  RemoveProjectsCommandHandler,
  RemoveProjectsFromMultipleCirclesCommandHandler,
  JoinUsingInvitationCommandHandler,
  JoinUsingDiscordCommandHandler,
  InviteToCircleCommandHandler,
  RemoveFromCircleCommandHandler,
  CreateCircleCommandHandler,
  AddRoleCommandHandler,
  RemoveRoleCommandHandler,
  UpdateRoleCommandHandler,
  UpdateMemberRolesCommandHandler,
];

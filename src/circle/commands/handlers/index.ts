import { UpdateMemberRolesCommandHandler } from '../membership/handlers/update-member-roles.handler';
import { InviteToCircleCommandHandler } from '../membership/handlers/invite-to-circle.handler';
import {
  JoinUsingDiscordCommandHandler,
  JoinUsingGuildxyzCommandHandler,
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
import {
  CreateCircleCommandHandler,
  CreateClaimableCircleCommandHandler,
} from './create-circle.handler';
import { AddSafeCommandHandler } from '../safe/handlers/add-safe.handler';
import { RemoveSafeCommandHandler } from '../safe/handlers/remove-safe.handler';
import { ClaimCircleCommandHandler } from '../claim/handlers/claim-circle.handler';
import { UpdateCircleCommandHandler } from './update-circle.handler';
import {
  AddProjectsCommandHandler,
  AddProjectsToMultipleCirclesCommandHandler,
} from '../projects/handlers/add-projects.handler';
import { ArchiveCircleByIdCommandHandler } from '../archive/handlers/archive-circle.handler';
import { WhitelistMemberAddressCommandHandler } from '../roles/handlers/whitelist-member-address.handler';

export const CommandHandlers = [
  RemoveProjectsCommandHandler,
  RemoveProjectsFromMultipleCirclesCommandHandler,
  AddProjectsCommandHandler,
  AddProjectsToMultipleCirclesCommandHandler,
  JoinUsingInvitationCommandHandler,
  JoinUsingDiscordCommandHandler,
  JoinUsingGuildxyzCommandHandler,
  InviteToCircleCommandHandler,
  RemoveFromCircleCommandHandler,
  CreateCircleCommandHandler,
  CreateClaimableCircleCommandHandler,
  AddRoleCommandHandler,
  RemoveRoleCommandHandler,
  UpdateRoleCommandHandler,
  UpdateMemberRolesCommandHandler,
  AddSafeCommandHandler,
  RemoveSafeCommandHandler,
  ClaimCircleCommandHandler,
  UpdateCircleCommandHandler,
  ArchiveCircleByIdCommandHandler,
  WhitelistMemberAddressCommandHandler,
];

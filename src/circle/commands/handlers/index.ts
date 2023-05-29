import { UpdateMemberRolesCommandHandler } from '../membership/handlers/update-member-roles.handler';
import { InviteToCircleCommandHandler } from '../membership/handlers/invite-to-circle.handler';
import {
  JoinAsWhitelistedAddressCommandHandler,
  JoinUsingDiscordCommandHandler,
  JoinUsingGuildxyzCommandHandler,
  JoinUsingInvitationCommandHandler,
  JoinWithoutInvitationCommandHandler,
} from '../membership/handlers/join-circle.handler';
import { RemoveFromCircleCommandHandler } from '../membership/handlers/remove-from-circle.handler';
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
import {
  UpdateCircleCommandHandler,
  UpdateMultipleCircleCommandHandler,
} from './update-circle.handler';
import { ArchiveCircleByIdCommandHandler } from '../archive/handlers/archive-circle.handler';
import { WhitelistMemberAddressCommandHandler } from '../roles/handlers/whitelist-member-address.handler';
import { CreateFolderCommandHandler } from '../folders/handlers/create-folder.handler';
import { UpdateFolderCommandHandler } from '../folders/handlers/update-folder.handler';
import { UpdateFolderOrderCommandHandler } from '../folders/handlers/update-folder-order.handler';
import { DeleteFolderCommandHandler } from '../folders/handlers/delete-folder.handler';
import { UpdateFolderDetailsCommandHandler } from '../folders/handlers/update-folder-details.handler';
import { AddAutomationCommandHandler } from '../automation/handlers/add-automation.handler';
import { UpdateAutomationCommandHandler } from '../automation/handlers/update-automation.handler';
import { RemoveAutomationCommandHandler } from '../automation/handlers/remove-automation.handler';
import {
  AddManualPaymentsCommandHandler,
  AddPaymentsCommandHandler,
} from '../payments/handlers/add-payment.handler';
import { MovePaymentsCommandHandler } from '../payments/handlers/move-payment.handler';
import {
  UpdateMultiplePaymentsCommandHandler,
  UpdatePaymentCommandHandler,
} from '../payments/handlers/update-payment.handler';
import { GetSpaceCollectionsCommandHandler } from './get-space-collections.handler';
import { GetRegistryCommandHandler } from './get-registry.handler';
import { UpgradePlanCommandHandler } from './uprade-plan.handler';
import { CancelPlanCommandHandler } from './cancel-plan.handler';

export const CommandHandlers = [
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
  CreateFolderCommandHandler,
  UpdateFolderCommandHandler,
  UpdateFolderOrderCommandHandler,
  DeleteFolderCommandHandler,
  JoinAsWhitelistedAddressCommandHandler,
  JoinWithoutInvitationCommandHandler,
  UpdateFolderDetailsCommandHandler,
  AddAutomationCommandHandler,
  UpdateAutomationCommandHandler,
  RemoveAutomationCommandHandler,
  UpdateMultipleCircleCommandHandler,
  AddPaymentsCommandHandler,
  MovePaymentsCommandHandler,
  UpdatePaymentCommandHandler,
  AddManualPaymentsCommandHandler,
  UpdateMultiplePaymentsCommandHandler,
  GetSpaceCollectionsCommandHandler,
  GetRegistryCommandHandler,
  UpgradePlanCommandHandler,
  CancelPlanCommandHandler,
];

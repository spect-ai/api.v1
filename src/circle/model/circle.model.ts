import { prop } from '@typegoose/typegoose';
import { ObjectId, Schema } from 'mongoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Collection } from 'src/collection/model/collection.model';
import { Payment } from 'src/common/models/payment.model';
import { ProfileModel } from 'src/common/models/profile.model';
import { Activity } from 'src/common/types/activity.type';
import { MemberRoles, Roles } from 'src/common/types/role.type';
import { Status } from 'src/common/types/status.type';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { User } from 'src/users/model/users.model';
import { MappedItem } from 'src/common/interfaces';
import {
  BlacklistRegistry,
  DiscordChannel,
  LocalRegistry,
  SafeAddresses,
  WhitelistedMembershipAddresses,
  Folder,
  AutomationType,
  RootAutomationsType,
  AutomationsIndexedByCollectionSlugType,
  PaymentDetails,
} from '../types';
import { Option } from 'src/collection/types/types';

export type Invite = {
  id: string;
  roles: string[];
  uses: number;
  expires: Date;
};

export type DiscordToCircleRoles = {
  [role: string]: {
    circleRole: string[];
    name: string;
  };
};

export type GuildxyzToCircleRoles = {
  [role: number]: {
    circleRole: string[];
    name: string;
    id: number;
  };
};

@useMongoosePlugin()
export class Circle extends ProfileModel {
  /**
   * The name of the profile
   */
  @prop({ required: true })
  name: string;

  /**
   * The slug of the profile, aka, the url of the profile
   */
  @prop({ required: true, unique: true })
  slug: string;

  /**
   * Circle is public or private
   */
  @prop({ default: false })
  private: boolean;

  /**
   * Parent Ids of the circle
   */
  @prop({ ref: () => Circle, default: [] })
  parents: ObjectId[];

  /**
   * Child Ids of the circle
   */
  @prop({ ref: () => Circle, default: [] })
  children: ObjectId[];

  /**
   * Projects in the circle
   */
  @prop({ ref: () => Project, default: [] })
  projects: ObjectId[];

  /**
   * Projects in the circle
   */
  @prop({ ref: () => Collection, default: [] })
  collections: ObjectId[];

  /**
   * Retros in the circle
   */
  @prop({ ref: () => Retro, default: [] })
  retro: ObjectId[];

  /**
   * Members in the circle
   */
  @prop({ ref: () => User, type: Schema.Types.String, default: [] })
  members: string[];

  /**
   * A list of roles that the circle has
   */
  @prop({ required: true })
  roles: Roles;

  /**
   * Members mapped to their respective roles
   */
  @prop({ default: {} })
  memberRoles: MemberRoles;

  /**
   * Default payment method of the circle
   */
  @prop({
    default: {
      chain: {
        chainId: '137',
        name: 'polygon',
      },
      token: {
        address: '0x0',
        symbol: 'MATIC',
      },
    },
  })
  defaultPayment: Payment;

  /**
   * Folder order of the circle
   */
  @prop({ default: [] })
  folderOrder: string[];

  /**
   * Folder Ids mapped to their respective Folder Details
   */

  @prop({ default: {} })
  folderDetails: MappedItem<Folder>;

  /**
   * Circle is archived
   */
  @prop({ default: false })
  archived: true;

  /**
   * Activity that took place in the circle
   */
  @prop({ default: [] })
  activity: Activity[];

  /**
   * The tokens whitelisted in the circle, these will be available in the circle on top of the globally available tokens
   */
  @prop({ default: {} })
  // eslint-disable-next-line @typescript-eslint/ban-types
  localRegistry: LocalRegistry | {};

  /**
   * The tokens whitelisted in the circle, these will be available in the circle on top of the globally available tokens
   */
  @prop({ default: {} })
  // eslint-disable-next-line @typescript-eslint/ban-types
  blacklistRegistry: BlacklistRegistry | {};

  /**
   * Invitations to the circle
   */
  @prop({ default: [] })
  invites: Invite[];

  /**
   * Discord server id of the circle
   */
  @prop()
  discordGuildId: string;

  /**
   * A list of roles that the circle has
   */
  @prop({ default: {} })
  discordToCircleRoles: DiscordToCircleRoles;

  /**
   * Guild.xyz guild
   */
  @prop()
  guildxyzId: number;

  /**
   * guild xyz role mapping
   */
  @prop({ default: {} })
  guildxyzToCircleRoles: GuildxyzToCircleRoles;

  /**
   * A list of repos that the circle uses
   */
  @prop({ default: [] })
  githubRepos: string[];

  /**
   * Gradient color of the circle
   */
  @prop()
  gradient: string;

  /**
   * Address of safe on different networks
   */
  @prop()
  safeAddresses: SafeAddresses;

  /**
   * The status of the circle
   */
  @prop({
    default: {
      active: true,
      archived: false,
    },
  })
  status: Status;

  @prop({ default: false })
  toBeClaimed: boolean;

  @prop()
  qualifiedClaimee: string[];

  /**
   * Custom labels for the circle
   */
  @prop({ default: [] })
  labels: string[];

  /**
   * Payment address of the circle
   */
  @prop()
  paymentAddress: string;

  @prop()
  questbookWorkspaceUrl?: string;

  @prop()
  questbookWorkspaceId?: string;

  @prop()
  grantMilestoneProject?: string;

  @prop()
  grantApplicantProject?: string;

  @prop()
  whitelistedMemberAddresses?: WhitelistedMembershipAddresses;

  @prop()
  grantNotificationChannel?: DiscordChannel;

  @prop({ default: false })
  forceShowOnExplore?: boolean;

  @prop({ default: false })
  verified?: boolean;

  @prop({ default: 0 })
  automationCount?: number;

  @prop()
  automations?: AutomationType;

  @prop({ default: [] })
  rootAutomations?: RootAutomationsType;

  @prop({ default: {} })
  automationsIndexedByCollection?: AutomationsIndexedByCollectionSlugType;

  @prop({ default: [] })
  nftTypeIds?: string[];

  @prop({ default: [] })
  pendingPayments?: string[];

  @prop({ default: [] })
  completedPayments?: string[];

  @prop({ default: [] })
  cancelledPayments?: string[];

  @prop({ default: {} })
  paymentDetails?: { [key: string]: PaymentDetails };

  @prop({ default: [] })
  paymentLabelOptions?: Option[];
}

export class ExtendedCircle extends Circle {
  /**
   * All the parents till the root circle
   */
  flattenedParents: Circle[];

  /**
   * All the children till the leaf circles
   */
  flattenedChildren: Circle[];
}

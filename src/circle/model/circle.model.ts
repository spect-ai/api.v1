import { prop, Ref } from '@typegoose/typegoose';
import { ProfileModel } from 'src/common/models/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Payment } from 'src/common/models/payment.model';
import { Activity } from 'src/common/types/activity.type';
import { Project } from 'src/project/model/project.model';
import { User } from 'src/users/model/users.model';
import { Chain } from 'src/common/models/chain.model';
import { ObjectId } from 'mongoose';
import { MemberRoles, Roles } from 'src/common/types/role.type';
import { Registry, TokenInfo } from 'src/registry/model/registry.model';

export type TokenDetails = {
  [tokenAddress: string]: TokenInfo;
};

export type LocalRegistry = {
  [chainId: string]: TokenDetails;
};

export type TokenBlacklisted = {
  [tokenAddress: string]: boolean;
};

export type BlacklistRegistry = {
  [chainId: string]: TokenBlacklisted;
};

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

// eslint-disable-next-line @typescript-eslint/ban-types
export type EmptyObject = {};

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
   * Members in the circle
   */
  @prop({ ref: () => User, default: [] })
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
  @prop()
  localRegistry: LocalRegistry | EmptyObject;

  /**
   * The tokens whitelisted in the circle, these will be available in the circle on top of the globally available tokens
   */
  @prop()
  blacklistRegistry: BlacklistRegistry | EmptyObject;

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
   * A list of repos that the circle uses
   */
  @prop({ default: [] })
  githubRepos: string[];
}

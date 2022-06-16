import { prop, Ref } from '@typegoose/typegoose';
import { ProfileModel } from 'src/common/models/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Payment } from 'src/common/models/payment.model';
import { ActivityModel } from 'src/common/models/activity.model';
import { Project } from 'src/project/model/project.model';
import { User } from 'src/users/model/users.model';
import { Chain } from 'src/common/models/chain.model';
import { ObjectId } from 'mongoose';
import { MemberRoles, Roles } from 'src/common/types/role.type';
import { Invite } from 'src/common/types/invite.type';

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
  @prop({ required: true })
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
  members: ObjectId[];

  /**
   * A list of roles that the circle has
   */
  @prop({
    default: {
      admin: {
        name: 'admin',
        description: 'Admin role',
        selfAssignable: false,
        permissions: {
          createNewCircle: true,
          manageCircleSettings: true,
          createNewProject: true,
          manageProjectSettings: true,
          createNewRetro: true,
          endRetroManually: true,
          managePaymentOptions: true,
          makePayment: true,
          inviteMembers: true,
          manageRoles: true,
          manageMembers: true,
        },
      },
      contributor: {
        name: 'contributor',
        description: 'Contributor role',
        selfAssignable: false,
        permissions: {
          createNewCircle: false,
          manageCircleSettings: false,
          createNewProject: true,
          manageProjectSettings: true,
          createNewRetro: true,
          endRetroManually: false,
          managePaymentOptions: false,
          makePayment: true,
          inviteMembers: true,
          manageRoles: false,
          manageMembers: false,
        },
      },
      member: {
        name: 'member',
        description: 'Member role',
        selfAssignable: false,
        permissions: {
          createNewCircle: false,
          manageCircleSettings: false,
          createNewProject: false,
          manageProjectSettings: false,
          createNewRetro: false,
          endRetroManually: false,
          managePaymentOptions: false,
          makePayment: false,
          inviteMembers: false,
          manageRoles: false,
          manageMembers: false,
        },
      },
    },
  })
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
  activity: ActivityModel[];

  /**
   * The tokens whitelisted in the circle, these will be available in the circle on top of the globally available tokens
   */
  @prop({ default: {} })
  whitelistedTokens: Chain;

  /**
   * Invitations to the circle
   */
  @prop({ default: [] })
  invites: Invite[];
}

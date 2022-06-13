import { prop, Ref } from '@typegoose/typegoose';
import { ProfileModel } from 'src/common/models/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { PaymentModel } from 'src/common/models/payment.model';

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
   * A list of roles that the circle has
   */
  @prop({ default: [] })
  roles: string[];

  /**
   * Members mapped to their respective roles
   */
  @prop({ default: {} })
  memberRoles: object;

  /**
   * Circle is public or private
   */
  @prop({ default: false })
  private: boolean;

  /**
   * Parent Ids of the circle
   */
  @prop({ ref: () => Circle, default: [] })
  parents: Ref<Circle>[];

  /**
   * Child Ids of the circle
   */
  @prop({ ref: () => Circle, default: [] })
  children: Ref<Circle>[];

  /**
   * Projects in the circle
   */
  @prop({ type: () => [String], default: [] })
  projects: string[];

  /**
   * Members in the circle
   */
  @prop({ type: () => [String], default: [] })
  members: string[];

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
  defaultPayment: PaymentModel;

  /**
   * Circle is archived
   */
  @prop({ default: false })
  archived: boolean;
}

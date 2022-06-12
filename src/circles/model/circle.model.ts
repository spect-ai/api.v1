import { prop, Ref } from '@typegoose/typegoose';
import { ProfileModel } from 'src/common/models/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

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
   * Circle is archived
   */
  @prop({ default: false })
  archived: boolean;
}

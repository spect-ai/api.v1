import { prop } from '@typegoose/typegoose';
import { ProfileModel } from 'src/profile/model/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class Circle extends ProfileModel {
  /**
   * Circle is public or private
   */
  @prop({ default: false })
  private: boolean;

  /**
   * Parent Ids of the circle
   */
  @prop({ type: () => [String], default: [] })
  parents: string[];

  /**
   * Child Ids of the circle
   */
  @prop({ type: () => [String], default: [] })
  children: string[];

  /**
   * Projects in the circle
   */
  @prop({ type: () => [String], default: [] })
  projects: string[];
}

import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export abstract class ProfileModel extends BaseModel {
  /**
   * The description of the profile
   */
  @prop()
  description: string;

  /**
   * The description of the profile
   */
  @prop()
  avatar: string;

  /**
   * The website associated with the profile
   */
  @prop()
  website: string;

  /**
   * The twitter account associated with the profile
   */
  @prop()
  twitter: string;

  /**
   * The github account associated with the profile
   */
  @prop()
  github: string;

  /**
   * The email associated with the profile
   */
  @prop()
  email: string;
}

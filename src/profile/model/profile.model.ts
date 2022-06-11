import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export abstract class ProfileModel extends BaseModel {
  /**
   * The name of the profile
   */
  @prop({ required: true })
  name: string;

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
   * The slug of the profile, aka, the url of the profile
   */
  @prop({ required: true })
  slug: string;

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

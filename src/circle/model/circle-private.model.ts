import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from './circle.model';

@useMongoosePlugin()
export class CirclePrivate extends BaseModel {
  /**
   * The api key
   */
  @prop({ default: '' })
  mintkudosApiKey: string;

  /**
   * The community Id
   */
  @prop({ default: '' })
  mintkudosCommunityId: string;

  /**
   * The api key
   */
  @prop({ default: '' })
  zealyApiKey: string;

  /**
   * The community Id
   */
  @prop({ default: '' })
  zealySubdomain: string;

  /**
   * Parent Ids of the circle
   */
  @prop({ ref: () => Circle, default: [] })
  circleId: string;
}

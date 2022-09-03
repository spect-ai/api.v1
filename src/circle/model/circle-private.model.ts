import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from './circle.model';

@useMongoosePlugin()
export class CirclePrivate extends BaseModel {
  /**
   * The api key
   */
  @prop({ required: true })
  mintkudosApiKey: string;

  /**
   * The community Id
   */
  @prop({ required: true })
  mintkudosCommunityId: string;

  /**
   * Parent Ids of the circle
   */
  @prop({ ref: () => Circle, default: [] })
  circleId: string;
}

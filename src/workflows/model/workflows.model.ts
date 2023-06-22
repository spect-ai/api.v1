import { FlowRuns } from '@avp1598/spect-shared-types';
import { prop } from '@typegoose/typegoose';
import { Schema } from 'mongoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';

@useMongoosePlugin()
export class Workflows extends BaseModel {
  /**
   * Name of the workflow
   */
  @prop({ required: true })
  name: string;

  /**
   * The workflow config
   */
  @prop({ type: Schema.Types.String })
  flowConfig?: string;

  /**
   * The workflow data
   */
  @prop({ type: Schema.Types.String })
  flowData?: string;

  /**
   * The flow data
   */
  @prop({ ref: () => Circle, type: Schema.Types.String })
  circle: string;

  /**
   * The flow runs
   */
  @prop()
  runs: FlowRuns;
}

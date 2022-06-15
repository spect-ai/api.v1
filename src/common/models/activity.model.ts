import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

export abstract class ActivityModel {
  /**
   * The commit id of the update of the activity, it is used to group updates that took place at the same time
   */
  @prop({ required: true })
  commitId?: string;

  /**
   * The id of the person who performed the activity
   */
  @prop({ required: true })
  actorId?: string;

  /**
   * The description of the activity
   */
  @prop({ required: true })
  description?: string;

  /**
   * The timestamp of the activity
   */
  @prop({ required: true })
  timestamp?: Date;
}

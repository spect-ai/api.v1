import { prop } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class StatusModel {
  /**
   * Created
   */
  @prop({ default: true })
  active: boolean;

  /**
   * In review
   */
  @prop({ default: false })
  inReview: boolean;

  /**
   * In revision
   */
  @prop({ default: false })
  inRevision: boolean;

  /**
   * Paid
   */
  @prop({ default: false })
  paid: boolean;

  /**
   * Archived
   */
  @prop({ default: false })
  archived: boolean;
}

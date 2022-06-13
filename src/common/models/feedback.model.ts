import { prop } from '@typegoose/typegoose';

export abstract class FeedbackModel {
  /**
   * The giver of the feedback
   */
  @prop({ required: true })
  giver?: string;

  /**
   * The receiver of the feedback
   */
  @prop({ required: true })
  receiver?: string;

  /**
   * The content of the feedback
   */
  @prop({ required: true })
  content?: string;
}

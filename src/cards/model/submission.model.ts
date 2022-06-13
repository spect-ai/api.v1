import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class SubmissionModel extends BaseModel {
  /**
   * The type of submission object (e.g. submission, revision instructions)
   */
  @prop({ required: true })
  type: string;

  /**
   * The submission content
   */
  @prop({ required: true })
  content: string;
}

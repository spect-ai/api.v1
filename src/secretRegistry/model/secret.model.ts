import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class Secret extends BaseModel {
  /**
   * username
   */
  @prop({ required: true })
  key: string;

  /**
   * The description of the profile
   */
  @prop({ required: true })
  value: any;
}

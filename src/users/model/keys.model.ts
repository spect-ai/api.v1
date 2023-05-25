import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class Keys extends BaseModel {
  @prop({ required: true })
  type: string;

  @prop({ required: true })
  key: string;

  @prop({ required: true })
  userId: string;
}

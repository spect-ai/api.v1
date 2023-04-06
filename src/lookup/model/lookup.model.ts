import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class Lookup extends BaseModel {
  @prop({ required: true })
  keyType: string;

  @prop({ required: true })
  key: string;

  @prop()
  collectionId: string;

  @prop()
  circleId: string;

  @prop()
  dataId: string;
}

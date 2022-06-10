import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class Cat extends BaseModel {
  /**
   * The name of the cat
   */
  @prop({ required: true })
  name: string;

  /**
   * The age of the cat
   */
  @prop()
  age?: number;
}

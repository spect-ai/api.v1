import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export abstract class ColumnDetailsModel extends BaseModel {
  /**
   * The name of the column
   */
  @prop({ required: true })
  name?: string;

  /**
   * The cards in the column
   */
  @prop({ default: [] })
  cards?: string[];

  /**
   * The default card type in the column, ie, task or bounty
   */
  @prop({ default: 0 })
  defaultCardType?: number;

  /**
   * The access to take various actions in the column
   */
  @prop()
  access: string[];
}

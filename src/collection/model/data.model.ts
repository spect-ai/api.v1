import { prop } from '@typegoose/typegoose';
import { Collection, Schema } from 'mongoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { MappedItem } from 'src/common/interfaces';

@useMongoosePlugin()
export class Data extends BaseModel {
  /**
   * Parent Ids of the collection
   */
  @prop({ ref: () => Collection, type: Schema.Types.String, default: [] })
  collection: string;

  /**
   * Data contained in the collection
   */
  @prop({ default: {} })
  data: MappedItem<any>;
}

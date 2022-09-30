import { prop } from '@typegoose/typegoose';
import { Schema } from 'mongoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';
import { MappedItem } from 'src/common/interfaces';
import { DefaultViewType, Property } from '../types/types';
import { Data } from './data.model';

@useMongoosePlugin()
export class Collection extends BaseModel {
  /**
   * The name of the collection
   */
  @prop({ required: true })
  name: string;
  /**
   * The unique slug of the collection
   */
  @prop({ required: true })
  slug: string;
  /**
   * Is collection private?
   */
  @prop({ default: false })
  private: boolean;
  /**
   * The description of the collection
   */
  @prop()
  description: string;

  /**
   * Properties in the collection
   */
  @prop()
  properties: MappedItem<Property>;

  /**
   * Properties in the collection
   */
  @prop({ default: [] })
  propertyOrder: string[];

  /**
   * The description of the collection
   */
  @prop({ required: true })
  creator: string;

  /**
   * Parent Ids of the collection
   */
  @prop({ ref: () => Circle, type: Schema.Types.String, default: [] })
  parents: string[];

  /**
   * The data contained in the collection
   */
  @prop({ default: {} })
  data: MappedItem<any>;

  /**
   * The data indexed by different fields
   */
  @prop({ default: {} })
  indexes: MappedItem<string[]>;

  /**
   * The default view of the collection
   */
  @prop({ default: 'table' })
  defaultView: DefaultViewType;
}

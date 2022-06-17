import { prop, Ref } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';
import { BaseModel } from 'src/base/base.model';
import { ColumnDetailsModel } from './columnDetails.model';
import { ObjectId } from 'mongoose';
import { ColumnDetailsDto } from '../dto/column-details.dto';

@useMongoosePlugin()
export class Project extends BaseModel {
  /**
   * The name of the profile
   */
  @prop({ required: true })
  name: string;

  /**
   * The description
   */
  @prop({})
  description: string;

  /**
   * The slug of the profile, aka, the url of the profile
   */
  @prop({ required: true })
  slug: string;

  /**
   * Project is public or private
   */
  @prop({ default: false })
  private: boolean;

  /**
   * Parent Ids of the project
   */
  @prop({ ref: () => Circle, default: [] })
  parents: ObjectId[];

  /**
   * Column order of the project
   */
  @prop({ default: [] })
  columnOrder: string[];

  /**
   * Column  of the project
   */
  @prop({})
  columnDetails: ColumnDetailsDto;

  /**
   * Project is archived
   */
  @prop({ default: false })
  archived: boolean;

  /**
   * Channel in which discussion threads about cards in the circle will be posted
   */
  @prop()
  discordDiscussionChannel: string;
}

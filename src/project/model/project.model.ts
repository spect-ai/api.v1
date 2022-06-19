import { prop } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';
import { BaseModel } from 'src/base/base.model';
import { ObjectId } from 'mongoose';
import { ColumnDetailsDto } from '../dto/column-details.dto';
import { Card } from 'src/card/model/card.model';
import { Automation, ValidActionId } from './automation.type';

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
   * Column details of the project
   */
  @prop({})
  columnDetails: ColumnDetailsDto;

  /**
   * Cards of the project
   *
   * !! Important, need to store as MAP to support dynamic key to reference
   */
  @prop({ ref: () => Card, default: [] })
  cards: ObjectId[];

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

  /**
   * The automations associated with the project, the trigger is the key and the value is the automation
   */
  @prop()
  automations?: Map<ValidActionId, Automation>;
}

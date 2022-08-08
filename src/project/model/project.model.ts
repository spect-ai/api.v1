import { prop } from '@typegoose/typegoose';
import { Schema } from 'mongoose';
import { Automation } from 'src/automation/types/types';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { MappedItem } from 'src/common/interfaces';
import { ColumnDetailsDto } from '../dto/column-details.dto';
import { View } from '../types/types';

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
  @prop({ required: true, unique: true })
  slug: string;

  /**
   * Project is public or private
   */
  @prop({ default: false })
  private: boolean;

  /**
   * Parent Ids of the project
   */
  @prop({ ref: () => Circle, type: Schema.Types.String, default: [] })
  parents: string[];

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

  /** Automation priority order */
  @prop({ default: [] })
  automationOrder: string[];

  /** Automation rule */
  @prop({ default: {} })
  automations: MappedItem<Automation>;

  /**
   * Cards of the project
   *
   * !! Important, need to store as MAP to support dynamic key to reference
   */
  @prop({ ref: () => Card, type: Schema.Types.String, default: [] })
  cards: string[];

  /**
   * Project is archived
   */
  @prop({ default: false })
  archived: boolean;

  /**
   * Channel in which discussion threads about cards in the circle will be posted
   */
  @prop()
  discordDiscussionChannel: {
    id: string;
    name: string;
  };

  /**
   * Order of the views in the project
   */
  @prop({ default: [] })
  viewOrder: string[];

  /**
   * Details of the views in the project
   */
  @prop({ default: [] })
  viewDetails: MappedItem<View>;

  /**
   * Number of views created in the project - used to generate slug in case of deleted views
   */
  @prop({ default: 0 })
  viewCount: number;

  /**
   * Number of cards created in the project - used to generate slug in case of deleted cards
   */
  @prop({ default: 0 })
  cardCount: number;
}

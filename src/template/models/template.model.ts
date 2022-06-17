import { prop, Ref } from '@typegoose/typegoose';
import { ObjectId } from 'mongoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { User } from 'src/users/model/users.model';
import { ProjectTemplateData } from '../dto/create-project-template-dto';

@useMongoosePlugin()
export class Template extends BaseModel {
  /**
   * The name of the temolate
   */
  @prop()
  name?: string;

  /**
   * The type of the temolate
   */
  @prop({ required: true, default: 'project' })
  type: string;

  /**
   * The template data that will be populated when the template is used
   */
  @prop({ required: true })
  data: ProjectTemplateData;

  /**
   * The circle that the template belongs to
   */
  @prop({ ref: () => Circle })
  circle?: ObjectId;

  /**
   * The creator of the template
   */
  @prop({ default: false })
  global?: boolean;

  /**
   * The creator of the template
   */
  @prop({ ref: () => User })
  creator?: ObjectId;
}

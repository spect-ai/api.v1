import { prop, Ref } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { Card } from 'src/card/model/card.model';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { User } from 'src/users/model/users.model';

export abstract class TemplateModel extends BaseModel {
  /**
   * The name of the temolate
   */
  @prop()
  name?: string;

  /**
   * The type of the temolate
   */
  @prop({ required: true })
  type: 'project' | 'card' | 'retro';

  /**
   * The template data that will be populated when the template is used
   */
  @prop({ required: true })
  data: Project | Card | Retro;

  /**
   * The creator of the template
   */
  @prop()
  creator?: Ref<User>;
}

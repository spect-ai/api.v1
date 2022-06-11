import { prop } from '@typegoose/typegoose';

export class CircleSchema {
  @prop({ required: true })
  name: string;

  description: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { prop } from '@typegoose/typegoose';

export class Cat {
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

import { prop } from '@typegoose/typegoose';
import { IsNotEmpty, IsString } from 'class-validator';

export class Cat {
  /**
   * The name of the cat
   */
  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  name: string;
}

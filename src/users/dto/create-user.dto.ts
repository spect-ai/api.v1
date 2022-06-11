import { prop } from '@typegoose/typegoose';
import { IsNotEmpty, IsString } from 'class-validator';

export class User {
  /**
   * The name of the user
   */
  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  name: string;

  /**
   * The ethereum address of the user
   */
  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  address: string;
}

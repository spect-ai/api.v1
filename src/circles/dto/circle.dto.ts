import { prop } from '@typegoose/typegoose';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class Circle {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  @prop({ required: true, unique: true })
  entityId: string;

  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  name: string;

  /**
   * The description of the circle
   */
  @IsString()
  @prop()
  description: string;

  /**
   * Circle is public or private
   */
  @IsBoolean()
  @prop({ default: false })
  private: boolean;
}

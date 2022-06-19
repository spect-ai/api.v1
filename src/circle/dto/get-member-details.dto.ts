import { IsArray, IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';

export class GetMemberDetailsOfCircleDto {
  /**
   * The ids of the circles
   */
  @IsArray()
  @IsNotEmpty()
  circleIds: ObjectId[];
}

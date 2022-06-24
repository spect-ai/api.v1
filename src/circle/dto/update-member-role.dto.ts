import { IsArray, IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';

export class UpdateMemberRolesDto {
  /**
   * The ids of the circles
   */
  @IsArray()
  @IsNotEmpty()
  roles: string[];
}

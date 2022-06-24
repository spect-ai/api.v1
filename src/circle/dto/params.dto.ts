import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class MemberDto {
  /**
   * Object Id
   */
  @IsObjectId({
    message: 'Invalid member object id',
  })
  @IsNotEmpty()
  member: string;
}

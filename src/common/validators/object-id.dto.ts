import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class ObjectIdDto {
  /**
   * Object Id
   */
  @IsObjectId({
    message: 'Invalid object id',
  })
  @IsNotEmpty()
  id: string;
}

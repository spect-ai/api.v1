import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class GetProjectTemplatesDto {
  /**
   * Object Id
   */
  @IsObjectId({
    message: 'Invalid object id',
  })
  @IsNotEmpty()
  circle: string;
}

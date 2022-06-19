import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ObjectIdDto } from 'src/common/validators/object-id.dto';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class GetByProjectAndSlugDto {
  /**
   * Project Object Id
   */
  @IsObjectId({
    message: 'Invalid project object id',
  })
  @IsNotEmpty()
  project: string;

  /**
   * Card Slug
   */
  @IsString()
  @IsNotEmpty()
  slug: string;
}

import { IsNotEmpty, IsString } from 'class-validator';
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

export class GetByProjectSlugAndCardSlugDto {
  /**
   * Project Slug
   */
  @IsString()
  @IsNotEmpty()
  projectSlug: string;

  /**
   * Card Slug
   */
  @IsString()
  @IsNotEmpty()
  cardSlug: string;
}

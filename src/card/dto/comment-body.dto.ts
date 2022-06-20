import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class AddCommentDto {
  /**
   * Comment
   */
  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class UpdateCommentDto extends PartialType(AddCommentDto) {}

import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { MappedItem } from 'src/common/interfaces';
import { Ref } from '../types/types';

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsObject()
  @IsNotEmpty()
  ref: MappedItem<Ref>;
}

export class UpdateCommentDto extends AddCommentDto {}

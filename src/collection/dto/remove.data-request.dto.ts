import { IsArray, IsNotEmpty } from 'class-validator';

export class RemoveDataDto {
  @IsArray()
  @IsNotEmpty()
  readonly dataIds: string[];
}

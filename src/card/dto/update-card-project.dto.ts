import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCardProjectDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;
}

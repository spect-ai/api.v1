import { IsNotEmpty, IsString } from 'class-validator';

export class AddNewTokenDto {
  @IsString()
  @IsNotEmpty()
  tokenAddress?: string;
}

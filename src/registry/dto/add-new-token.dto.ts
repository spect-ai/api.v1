import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddNewTokenDto {
  @IsString()
  @IsNotEmpty()
  chainId: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsString()
  @IsOptional()
  name: string;
}

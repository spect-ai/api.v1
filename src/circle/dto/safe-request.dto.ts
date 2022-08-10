import { IsNotEmpty, IsString } from 'class-validator';

export class SafeAddress {
  @IsString()
  @IsNotEmpty()
  chainId: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}

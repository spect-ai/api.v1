import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectUserDto {
  /**
   * The signature of the user
   */
  @IsString()
  @IsNotEmpty()
  signature: string;

  /**
   * The message of the signature
   */
  @IsString()
  @IsNotEmpty()
  message: string;
}

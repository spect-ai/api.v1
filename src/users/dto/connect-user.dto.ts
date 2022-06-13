import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectUserDto {
  /**
   * The web3-token of the user
   */
  @IsString()
  @IsNotEmpty()
  token: string;

  // /**
  //  * The encrypted signature of the user
  //  */
  // @IsString()
  // @IsNotEmpty()
  // signature: string;

  /**
   * Some custom data
   */
  @IsString()
  data: string;
}

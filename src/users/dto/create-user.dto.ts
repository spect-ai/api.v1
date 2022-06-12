import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  /**
   * The name of the user
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The ethereum address of the user
   */
  @IsString()
  @IsNotEmpty()
  ethAddress: string;
}

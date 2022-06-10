import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  /**
   * The name of the user
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The email of the user
   */
  @IsString()
  @IsNotEmpty()
  address: string;
}

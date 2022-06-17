import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  /**
   * The name of the user
   */
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * The ethereum address of the user
   */
  @IsString()
  @IsNotEmpty()
  ethAddress: string;

  /**
   * The avatar of the user
   */
  @IsString()
  @IsOptional()
  avatar: string;
}

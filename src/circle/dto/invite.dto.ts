import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class InviteDto {
  /**
   * The role given to the invited user
   */
  @IsArray()
  @IsNotEmpty()
  roles: string;

  /**
   * Expires at timestamp
   */
  @IsString()
  @IsNotEmpty()
  expires: string;

  /**
   * Number of times the invite can been used
   */
  @IsNumber()
  @IsNotEmpty()
  uses: number;
}

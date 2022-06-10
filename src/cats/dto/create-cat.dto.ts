import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCatDto {
  /**
   * The name of the cat
   */
  @IsString()
  @IsNotEmpty()
  name: string;
}

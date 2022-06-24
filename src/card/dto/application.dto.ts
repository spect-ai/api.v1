import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class CreateApplicationDto {
  /**
   * Application content
   */
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {}

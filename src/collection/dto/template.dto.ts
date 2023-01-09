import { IsNotEmpty, IsString } from 'class-validator';

export class UseTemplateDto {
  /**
   * Name of the automation
   **/
  @IsString()
  @IsNotEmpty()
  name: string;
}

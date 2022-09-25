import { IsNotEmpty, IsString } from 'class-validator';

export class AddPropertyDto {
  /**
   * The properties associated with the collection
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The properties associated with the collection
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * The properties associated with the collection
   */
  @IsString()
  @IsNotEmpty()
  default: string;

  /**
   * The properties associated with the collection
   */
  @IsString()
  @IsNotEmpty()
  placeholder: string;
}

export class UpdatePropertyDto extends AddPropertyDto {}

import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SocialsDto {
  @IsOptional()
  @IsObject()
  readonly telegram: {
    id: string;
    username: string;
    first_name: string;
  };

  @IsOptional()
  @IsObject()
  readonly github: {
    id: string;
    username: string;
  };

  @IsNotEmpty()
  @IsString()
  readonly discordId: string;

  @IsOptional()
  @IsObject()
  readonly discord: {
    id: string;
    username: string;
  };

  @IsString()
  readonly propertyName: string;
}

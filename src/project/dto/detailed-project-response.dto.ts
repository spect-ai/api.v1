import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateNested,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { Automation, ValidActionId } from '../model/automation.type';

export type MinimalCard = {
  id: string;
  name: string;
  type: number;
  reward: number;
  slug: string;
  deadline: string;
  labels: string[];
};

export type CardDetails = {
  [key: string]: MinimalCard;
};

export class DetailedProjectResponseDto {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The description
   */
  @IsOptional()
  @IsString()
  description: string;

  /**
   * The slug of the profile, aka, the url of the profile
   */
  @IsString()
  @IsNotEmpty()
  slug: string;

  /**
   * Project is public or private
   */
  @IsBoolean()
  private: boolean;

  /**
   * The parents of the circle, aka, the circles that contain this project
   */
  @IsOptional()
  @ValidateNested()
  parents?: string[];

  /**
   * The order of the columns in the project
   */
  @IsArray()
  columnOrder?: string[];

  /**
   * The details of the columns in the project
   */
  @IsObject()
  columnDetails?: object;

  /**
   * Cards of the project
   */
  @IsObject()
  cards: CardDetails;

  /**
   * Project is archived
   */
  @IsBoolean()
  @IsOptional()
  archived: boolean;

  /**
   * Channel in which discussion threads about cards in the circle will be posted
   */
  @IsString()
  @IsOptional()
  discordDiscussionChannel: string;

  /**
   * The automations associated with the project, the trigger is the key and the value is the automation
   */
  @IsObject()
  @IsOptional()
  automations?: Map<ValidActionId, Automation>;
}

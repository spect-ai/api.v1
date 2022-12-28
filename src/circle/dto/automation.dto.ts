import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Action, Condition, Trigger } from '../types';

export class CreateAutomationDto {
  /**
   * Name of the automation
   **/
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Description of the automation
   **/
  @IsString()
  @IsOptional()
  description: string;

  /**
   * Category of the automation
   **/
  @IsString()
  @IsNotEmpty()
  triggerCategory: 'collection' | 'root';

  /**
   * Slug of collection if trigger is in collection
   **/
  @IsString()
  @IsOptional()
  triggerCollectionSlug?: string;

  /**
   * Trigger of the automation
   **/
  @IsObject()
  @IsNotEmpty()
  trigger: Trigger;

  /**
   * Actions of the automation
   **/
  @IsArray()
  @IsNotEmpty()
  actions: Action[];

  /**
   * Conditons of the automation
   **/
  @IsArray()
  @IsOptional()
  conditions: Condition[];
}

export class UpdateAutomationDto {
  /**
   * Name of the automation
   **/
  @IsString()
  @IsOptional()
  name: string;

  /**
   * Description of the automation
   **/
  @IsString()
  @IsOptional()
  description: string;

  /**
   * Trigger of the automation
   **/
  @IsObject()
  @IsOptional()
  trigger: Trigger;

  /**
   * Actions of the automation
   **/
  @IsArray()
  @IsOptional()
  actions: Action[];

  /**
   * Conditons of the automation
   **/
  @IsArray()
  @IsOptional()
  conditions: Condition[];

  /**
   * Automation is disabled
   **/
  @IsBoolean()
  @IsOptional()
  disabled: string;
}

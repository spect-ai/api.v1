import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Action, Condition, Trigger } from '../types/types';
import { IsAction, IsCondition, IsTrigger } from '../validators';

export class CreateAutomationDto {
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsTrigger()
  trigger: Trigger;

  @IsNotEmpty()
  @IsCondition()
  conditions: Condition[];

  @IsNotEmpty()
  @IsAction()
  actions: Action[];
}

export class UpdateAutomationDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsNotEmpty()
  @IsTrigger()
  @IsOptional()
  trigger: Trigger;

  @IsNotEmpty()
  @IsCondition()
  @IsOptional()
  conditions: Condition[];

  @IsNotEmpty()
  @IsAction()
  @IsOptional()
  actions: Action[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

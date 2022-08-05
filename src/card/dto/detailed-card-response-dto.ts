import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Payment } from 'src/common/models/payment.model';
import { Status } from 'src/common/types/status.type';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { Project } from 'src/project/model/project.model';
import {
  ApplicationDetails,
  ApplicationUnit,
  WorkThreads,
} from '../types/types';

export class DetailedCardResponseDto {
  /**
   * The id of the card
   */
  @IsString()
  @IsNotEmpty()
  id: string;

  /**
   * The title of the card
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * The description of the card
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The title of the card
   */
  @IsString()
  @IsNotEmpty()
  slug: string;

  /**
   * The creator of the card
   */
  @IsString()
  creator: string;

  /**
   * The reviewers of the card
   */
  @IsArray()
  @IsOptional()
  reviewer?: string[];

  /**
   * The assignees of the card
   */
  @IsArray()
  @IsOptional()
  assignee?: string[];

  /**
   * The project of the card
   */
  @IsString()
  project: string | Project | DetailedProjectResponseDto;

  /**
   * The reward of the card
   */
  @IsObject()
  @IsOptional()
  reward?: Payment;

  /**
   * The type of the card
   */
  @IsString()
  @IsOptional()
  type?: string;

  /**
   * The deadline of the card
   */
  @IsDateString()
  @IsOptional()
  deadline?: string;

  /**
   * The labels of the card
   */
  @IsArray()
  @IsOptional()
  labels?: string[];

  /**
   * The priority of the card
   */
  @IsNumber()
  @IsOptional()
  priority?: number;

  /**
   * The columnId of the card
   */
  @IsString()
  columnId?: string;

  /**
   * The status of the card
   */
  @IsObject()
  status?: Status;

  /**
   * The applications submitted to a bounty
   */
  @IsObject()
  application?: ApplicationDetails;

  /**
   * The order in which applications are saved
   */
  @IsArray()
  applicationOrder?: string[];
  /**
   * The application of the caller
   */
  @IsObject()
  myApplication?: ApplicationUnit;

  /**
   * The history of work done on the card, supports multiple parallel work histories so
   * multiple people can work on the same card (relevant for contests, cooperatives etc)
   */
  @IsObject()
  workThreads?: WorkThreads;
}

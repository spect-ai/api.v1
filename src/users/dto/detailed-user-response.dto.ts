import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Circle } from 'src/circle/model/circle.model';
import { MappedPartialItem } from 'src/common/interfaces';
import { User } from '../model/users.model';
import { Activity } from '../types/types';

export class DetailedUserPubliceResponseDto {
  /**
   * The name of the user
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username: string;

  /**
   * Bio of the user
   */
  @IsString()
  @IsOptional()
  bio?: string;

  /**
   * The ethereum address of the user
   */
  @IsString()
  @IsNotEmpty()
  ethAddress: string;

  /**
   * The avatar of the user
   */
  @IsString()
  @IsOptional()
  avatar: string;

  /**
   * List of circles this user is a member of
   */
  @IsArray()
  @IsOptional()
  circles: string[];

  /**
   * Activities taken by the user
   */
  @IsArray()
  @IsOptional()
  activities: Activity[];

  /**
   * Associated user details
   */
  @IsObject()
  userDetails: MappedPartialItem<User>;

  /**
   * Assciated circle details
   */
  @IsObject()
  circleDetails: MappedPartialItem<Circle>;
}

export class DetailedUserPrivateResponseDto extends DetailedUserPubliceResponseDto {
  /**
   * Discord Integration user id
   */
  @IsString()
  discordId: string;

  /**
   * Github Integration user id
   */
  @IsString()
  githubId: string;

  /**
   * List of accounts connected to this user
   */
  @IsArray()
  accounts: string[];

  /**
   * Notifications for the user
   */
  @IsArray()
  notifications: Notification[];
}

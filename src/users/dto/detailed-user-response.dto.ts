import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';
import { MappedCard } from 'src/card/types/types';
import { Circle } from 'src/circle/model/circle.model';
import { Activity, MappedUser, Notification } from '../types/types';

export class DetailedUserPubliceResponseDto {
  /**
   * The name of the user
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username: string;

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
   * List of cards a user is currently assigned to
   */
  @IsArray()
  @IsOptional()
  assignedCards: string[];

  /**
   * List of cards a user is currently reviewing
   */
  @IsArray()
  @IsOptional()
  reviewingCards: string[];

  /**
   * List of cards a user was assigned to that have been closed
   */
  @IsArray()
  @IsOptional()
  assignedClosedCards: string[];

  /**
   * List of cards a user was reviewing that have been closed
   */
  @IsArray()
  @IsOptional()
  reviewingClosedCards: string[];

  /**
   * Activities taken by the user
   */
  @IsArray()
  @IsOptional()
  activities: Activity[];

  /**
   * Users followed by the user
   */
  @IsArray()
  @IsOptional()
  followedUsers: string[];

  /**
   * Users following the user
   */
  @IsArray()
  @IsOptional()
  followedByUsers: string[];

  /**
   * Associated user details
   */
  @IsObject()
  userDetails: MappedUser;

  /**
   * Assciated card details
   */
  @IsObject()
  cardDetails: MappedCard;

  /**
   * Assciated circle details
   */
  @IsObject()
  circleDetails: { [id: string]: Partial<Circle> };
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

  /**
   * Card bookmarks for the user
   */
  @IsArray()
  bookmarks: string[];
}

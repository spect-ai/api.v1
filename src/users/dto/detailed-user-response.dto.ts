import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { MappedItem, MappedPartialItem } from 'src/common/interfaces';
import { User } from '../model/users.model';
import { Activity, Notification } from '../types/types';

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
   * Skills of the user
   */
  @IsArray()
  @IsOptional()
  skills?: string[];

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
  userDetails: MappedPartialItem<User>;

  /**
   * Assciated card details
   */
  @IsObject()
  cardDetails: MappedPartialItem<Card>;

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

  /**
   * Card bookmarks for the user
   */
  @IsArray()
  bookmarks: string[];
}

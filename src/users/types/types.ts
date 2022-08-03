import { User } from '../model/users.model';

export type MappedUser = {
  [id: string]: Partial<User>;
};

export type Notification = {
  content: string;
  linkPath: string[];
  actor: string;
  timestamp: Date;
  ref: Reference;
};

export type Activity = {
  id: string;
  actionType: string;
  content: string;
  timestamp: Date;
  linkPath: string[];
  stakeholders: string[];
  ref: Reference;
};

export type Reference = {
  cards?: ContentPlaceholder;
  users?: ContentPlaceholder;
  circles?: ContentPlaceholder;
  projects?: ContentPlaceholder;
};

export type ContentPlaceholder = {
  [key: string]: string;
};

export type PopulatedUserFields = {
  bookmarks?: { [fieldName: string]: 0 | 1 };
  reviewingCards?: { [fieldName: string]: 0 | 1 };
  assignedCards?: { [fieldName: string]: 0 | 1 };
  reviewingClosedCards?: { [fieldName: string]: 0 | 1 };
  assignedClosedCards?: { [fieldName: string]: 0 | 1 };
  followedCircles?: { [fieldName: string]: 0 | 1 };
  followedUsers?: { [fieldName: string]: 0 | 1 };
  followedByUsers?: { [fieldName: string]: 0 | 1 };
};

export type UserSubmittedApplication = {
  cardId: string;
  applicationTitle: string;
};

export type ArrayField =
  | 'bookmarks'
  | 'followingCircles'
  | 'memberOfCircles'
  | 'followingUsers'
  | 'followers'
  | 'activeApplications'
  | 'pickedApplications'
  | 'rejectedApplications'
  | 'assignedCards'
  | 'reviewingCards'
  | 'assignedClosedCards'
  | 'reviewingClosedCards';

export type FlattendedArrayFieldItems = {
  fieldName: ArrayField;
  itemIds: string[] | UserSubmittedApplication[];
};

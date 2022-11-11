import { User } from '../model/users.model';

export type MappedUser = {
  [id: string]: Partial<User>;
};

export type Notification = {
  id: string;
  content: string;
  type: 'card' | 'project' | 'circle' | 'retro';
  entityId: string;
  linkPath: string[];
  actor: string;
  timestamp: Date;
  ref: Reference;
  read: boolean;
};

export type NotificationV2 = {
  id: string;
  content: string;
  ref?: Reference;
  read: boolean;
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
  | 'circles'
  | 'followingUsers'
  | 'followers'
  | 'activeApplications'
  | 'pickedApplications'
  | 'rejectedApplications'
  | 'assignedCards'
  | 'reviewingCards'
  | 'assignedClosedCards'
  | 'reviewingClosedCards'
  | 'followedCircles'
  | 'retro';

export type FlattendedArrayFieldItems = {
  fieldName: ArrayField;
  itemIds: string[] | UserSubmittedApplication[];
};

// Map collection slug to data slug
export type FormResponses = {
  [collectionSlug: string]: string[];
};

export type Credential = {
  id: string;
  platform: string;
  credentialId: string;
};

export type Experience = {
  role: string;
  organization: string;
  description: string;
  startDate: string;
  endDate: string;
  verifiableCredentials: Credential[];
};
export type Skill = {
  name: string;
  verifiableCredentials: Credential[];
  id: string;
};

export type Education = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  verifiableCredentials: Credential[];
  id: string;
};

export type LensProfile = {
  id: string;
  name: string;
  bio: string;
  handle: string;
  attributes: LensAttribute[];
};

export type LensAttribute = {
  id: string;
  key: string;
  value: string;
  type: string;
};

export type LensSkills = {
  title: string;
  icon: string;
  nfts: string[];
  poaps: string[];
  verifiableCredentials: Credential[];
};

export type LensExperience = {
  jobTitle: string;
  company: number;
  companyLogo: string;
  description: string;
  start_date: string;
  end_date: string;
  verifiableCredentials: Credential[];
  currentlyWorking: boolean;
  nfts: string[];
  poaps: string[];
};

export type LensEducation = {
  courseDegree: string;
  school: string;
  schoolLogo: string;
  description: string;
  start_date: string;
  end_date: string;
  currentlyStudying: boolean;
  nfts: string[];
  poaps: string[];
  verifiableCredentials: Credential[];
};

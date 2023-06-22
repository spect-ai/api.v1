import { User } from '../model/users.model';

export type MappedUser = {
  [id: string]: Partial<User>;
};

export type NotificationV2 = {
  content: string;
  avatar: string;
  redirect: string;
  timestamp: string;
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

export type ArrayField = 'circles' | 'collectionsSubmittedTo' | 'collections';

export type FlattendedArrayFieldItems = {
  fieldName: ArrayField;
  itemIds: string[];
};

// Map collection slug to data slug
export type FormResponses = {
  [collectionSlug: string]: string[];
};

export type Credential = {
  id: string;
  name: string;
  description: string;
  imageUri: string;
  type: 'vc' | 'soulbound';
  service: string;
  metadata?: VerifiableCredential | SoulboundCredential;
};

export type VerifiableCredential = {
  ceramicStreamId?: string;
  providerName?: string; // relevant for gtc passport
};

export type SoulboundCredential = {
  contractAddress?: string;
  tokenId?: string;
  chainId?: string;
  type?: 'erc721' | 'erc1155';
};

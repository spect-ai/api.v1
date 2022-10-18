import { MappedItem } from 'src/common/interfaces';
import {
  Activity,
  DefaultViewType,
  NotificationSettings,
  Property,
} from '../types/types';

export class CollectionPublicResponseDto {
  name: string;
  slug: string;
  description: string;

  properties: MappedItem<Property>;

  propertyOrder: string[];
  defaultView: DefaultViewType;

  formRoleGating: number[];

  canFillForm: boolean;

  messageOnSubmission: string;

  mintkudosTokenId: number;

  kudosClaimedByUser: boolean;

  multipleResponsesAllowed: boolean;
  updatingResponseAllowed: boolean;

  previousResponses: MappedItem<object>;
}

export class CollectionResponseDto {
  name: string;
  slug: string;
  description: string;

  properties: MappedItem<Property>;

  propertyOrder: string[];

  creator: string;

  parents: string[];

  data: MappedItem<object>;

  dataActivities: MappedItem<MappedItem<Activity>>;

  dataActivityOrder: MappedItem<string[]>;

  indexes: MappedItem<string[]>;

  defaultView: DefaultViewType;
  notificationSettings: NotificationSettings;

  formRoleGating: number[];

  canFillForm: boolean;

  mintkudosTokenId: number;

  messageOnSubmission: string;
}

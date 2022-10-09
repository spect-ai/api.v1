import { MappedItem } from 'src/common/interfaces';

export type UserType = 'assignee' | 'reviewer' | 'grantee' | 'applicant';

export type Property = {
  name: string;
  type: PropertyType;
  isPartOfFormView: boolean;
  immutable?: boolean;
  default?: any;
  condition?: any; // Show property only when condition is met
  options?: Option[];
  userType?: UserType; // user type only relevant when type is user or user[]
  onUpdateNotifyUserTypes?: UserType[];
};

export type PropertyType =
  | 'shortText'
  | 'longText'
  | 'number'
  | 'user[]'
  | 'user'
  | 'reward'
  | 'date'
  | 'singleSelect'
  | 'multiSelect'
  | 'ethAddress';

export type Option = {
  label: string;
  value: string | number;
};

export type Conditions = Condition[];

export type Condition = DateConditions;

export type DateConditions = {
  propertyId: string;
  condition: ComparisonCondition;
  feedback: string;
};

export type ComparisonCondition = 'greaterThanOrEqualTo' | 'lessThanOrEqualTo';

export type PopulatedCollectionFields = {
  parents?: { [fieldName: string]: number };
};

export type DefaultViewType = 'form' | 'table' | 'kanban' | 'list' | 'gantt';

export type NotificationSettings = {
  userRecipientsOnCollectionSettingsUpdate: string[];
  userRecipientsOnPropertyUpdates: string[];
  userRecipientsOnNewData: string[];
};

export type Ref = {
  id: string;
  refType: 'user' | 'circle' | 'collection';
};

export type Activity = {
  content: string;
  ref: MappedItem<Ref>;
  timestamp: Date;
  comment: boolean;
};

import { Data } from '../model/data.model';

export type Property = {
  name: string;
  type: PropertyType;
  isPartOfFormView: boolean;
  default?: any;
  condition?: any; // Show property only when condition is met
  options?: Option[];
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

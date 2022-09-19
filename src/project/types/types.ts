import { Status } from 'src/common/types/status.type';
import { Project } from '../model/project.model';

export type MappedProject = {
  [id: string]: Partial<Project>;
};

export type CardLoc = {
  columnId: string;
  cardIndex: number;
};

export type MappedView = {
  [id: string]: View;
};

export type Filter = {
  assignee: string[];
  reviewer: string[];
  column: string[];
  label: string[];
  status: Status;
  title: string;
  type: string[];
  priority: string[];
  deadline: string;
};

export type View = {
  type: 'List' | 'Board' | 'Gantt';
  hidden: boolean;
  filters: Filter;
  slug: string;
  name: string;
};

export type PopulatedProjectFields = {
  cards?: { [fieldName: string]: 0 | 1 };
  parents?: { [fieldName: string]: 0 | 1 };
};

export type FlattendedArrayFieldItems = {
  fieldName: 'parents';
  itemIds: string[];
};

export type CardTemplate = {
  name: string;
  description?: string;
  propertyOrder: string[];
  properties: Properties;
};

export type CardTemplates = { [id: string]: CardTemplate };

export type Properties = Map<string, Property>;

// export type PropertyId =
//   | 'assignee'
//   | 'reviewer'
//   | 'start-date'
//   | 'deadline'
//   | 'priority'
//   | 'reward'
//   | 'grantee'
//   | 'programLiaison'
//   | 'approvedOn'
//   | 'completedOn'
//   | 'grantStatus'
//   | 'link-to-application';

export type Property = {
  name: string;
  type: PropertyType;
  value: any;
  default?: any;
  conditions?: Conditions;
  options?: Option[];
  roleGate: string[];
  typeGate: string[];
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

export type Conditions = DateConditions;

export type DateConditions = {
  propertyId: string;
  condition: Condition;
  feedback: string;
};

export type Condition = 'greaterThanOrEqualTo' | 'lessThanOrEqualTo';

export type Option = {
  label: string;
  value: string | number;
};

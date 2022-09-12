import { Properties, Property } from 'src/card/types/types';
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

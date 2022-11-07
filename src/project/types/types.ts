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

export type ViewType = 'List' | 'Board' | 'Gantt' | 'Table';

export type View = {
  type: 'List' | 'Board' | 'Gantt' | 'Table';
  hidden: boolean;
  filters: Filter;
  slug: string;
  name: string;
};

export type PopulatedProjectFields = {
  cards?: { [fieldName: string]: 0 | 1 | { [fieldName: string]: 0 | 1 } };
  parents?: { [fieldName: string]: 0 | 1 };
};

export type FlattendedArrayFieldItems = {
  fieldName: 'parents';
  itemIds: string[];
};

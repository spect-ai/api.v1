import { Project } from '../model/project.model';

export type MappedProject = {
  [id: string]: Partial<Project>;
};

export type CardLoc = {
  columnId: string;
  cardIndex: number;
};

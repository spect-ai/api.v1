import { MappedCard } from 'src/card/types/types';
import { MappedProject } from 'src/project/types/types';

export type GlobalDocumentUpdate = {
  card: MappedCard;
  project: MappedProject;
};

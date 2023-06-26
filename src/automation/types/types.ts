import { Circle } from 'src/circle/model/circle.model';
import { Collection } from 'src/collection/model/collection.model';
import { MappedItem, MappedPartialItem } from 'src/common/interfaces';
import { Status } from 'src/common/types/status.type';
import { User } from 'src/users/model/users.model';

export type DataContainer = {
  collection?: MappedItem<Collection>;
  circle?: MappedItem<Circle>;
};

export type AutomationUpdatesContainer = {
  collection?: MappedItem<Partial<Collection>>;
  circle?: MappedItem<Partial<Circle>>;
  user?: MappedItem<Partial<User>>;
};

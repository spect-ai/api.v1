export interface Diff<T> {
  added: Partial<T>;
  deleted: Partial<T>;
  updated: Partial<T>;
}

export interface MappedDiff<T> {
  [id: string]: Diff<T>;
}

export interface MappedPartialItem<T> {
  [id: string]: Partial<T>;
}

export interface MappedItem<T> {
  [id: string]: T;
}

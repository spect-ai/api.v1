export interface Diff<T> {
  added: Partial<T>;
  deleted: Partial<T>;
  updated: Partial<T>;
}

export interface MappedDiff<T> {
  [id: string]: Diff<T>;
}

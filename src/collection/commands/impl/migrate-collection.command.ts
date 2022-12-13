export class MigrateCollectionCommand {
  constructor(
    public readonly projectId: string,
    public readonly caller: string,
  ) {}
}

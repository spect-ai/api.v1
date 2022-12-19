export class MigrateProjectCommand {
  constructor(
    public readonly projectId: string,
    public readonly caller: string,
  ) {}
}

export class MigrateAllCollectionsCommand {
  constructor(public readonly caller: string) {}
}

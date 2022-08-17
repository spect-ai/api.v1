export class ArchiveCardByIdCommand {
  constructor(public readonly id: string) {}
}

export class ArchiveMultipleCardsByIdCommand {
  constructor(
    public readonly ids: string[],
    public readonly removeFromProject?: boolean,
  ) {}
}

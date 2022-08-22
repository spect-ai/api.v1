export class RevertArchiveCardByIdCommand {
  constructor(public readonly id: string) {}
}

export class RevertArchivalMultipleCardsByIdCommand {
  constructor(
    public readonly ids: string[],
    public readonly addToProject?: boolean,
  ) {}
}

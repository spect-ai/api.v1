export class ImportTrelloCommand {
  constructor(
    public readonly projectId: string,
    public readonly trelloId: string,
    public readonly callerId: string,
  ) {}
}

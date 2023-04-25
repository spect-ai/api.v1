export class DeleteDraftCommand {
  constructor(
    public readonly discordId: string,
    public readonly messageId: string,
  ) {}
}

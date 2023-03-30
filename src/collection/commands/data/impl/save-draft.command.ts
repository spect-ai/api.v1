export class SaveDraftFromDiscordCommand {
  constructor(
    public readonly data: object,
    public readonly callerDiscordId: string,
    public readonly channelId: string,
  ) {}
}

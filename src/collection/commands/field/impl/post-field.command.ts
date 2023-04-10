export class PostNextFieldCommand {
  constructor(
    public readonly channelId: string,
    public readonly discordUserId: string,
  ) {}
}

export class SkipAndPostNextFieldCommand {
  constructor(
    public readonly channelId: string,
    public readonly discordUserId: string,
  ) {}
}

export class SaveAndPostNextFieldCommand {
  constructor(
    public readonly channelId: string,
    public readonly discordUserId: string,
    public readonly value: any,
  ) {}
}

export class PostPreviousFieldCommand {
  constructor(
    public readonly channelId: string,
    public readonly discordUserId: string,
  ) {}
}

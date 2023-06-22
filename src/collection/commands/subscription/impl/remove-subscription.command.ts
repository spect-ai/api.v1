export class RemoveSubscriptionCommand {
  constructor(
    public readonly collectionSlug: string,
    public readonly eventName: string,
    public readonly subscribedUrl: string,
  ) {}
}

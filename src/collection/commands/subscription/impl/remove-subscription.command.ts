export class RemoveSubscriptionCommand {
  constructor(
    public readonly collectionId: string,
    public readonly eventName: string,
    public readonly subscriptionId: string,
  ) {}
}

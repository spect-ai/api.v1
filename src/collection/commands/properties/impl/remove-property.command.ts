export class RemovePropertyCommand {
  constructor(
    public readonly caller: string,
    public readonly collectionId: string,
    public readonly propertyId: string,
  ) {}
}

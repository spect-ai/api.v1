export class RemoveDataCommand {
  constructor(
    public readonly caller: string,
    public readonly collectionId: string,
    public readonly dataSlug: string,
  ) {}
}

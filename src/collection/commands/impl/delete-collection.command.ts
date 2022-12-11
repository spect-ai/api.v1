export class DeleteCollectionCommand {
  constructor(
    public readonly collectionId: string,
    public readonly caller: string,
  ) {}
}

export class UpdateDataCommand {
  constructor(
    public readonly data: object,
    public readonly caller: string,
    public readonly collectionId: string,
    public readonly dataSlug: string,
  ) {}
}

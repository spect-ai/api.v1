export class DeleteFolderCommand {
  constructor(
    public readonly circleId: string,
    public readonly folderId: string,
  ) {}
}

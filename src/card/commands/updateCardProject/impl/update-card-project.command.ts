export class UpdateProjectCardCommand {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly caller: string,
  ) {}
}

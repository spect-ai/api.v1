export class ActivityEvent {
  constructor(
    public readonly type: string,
    public readonly recipient: string,
    public readonly linkPath: string[],
    public readonly actor: string,
    public readonly title: string,
  ) {}
}

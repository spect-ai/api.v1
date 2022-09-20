export class RemoveAutomationCommand {
  constructor(
    public readonly id: string,
    public readonly automationId: string,
  ) {}
}

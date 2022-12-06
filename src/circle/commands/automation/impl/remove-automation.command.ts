export class RemoveAutomationCommand {
  constructor(
    public readonly circleId: string,
    public readonly automationId: string,
  ) {}
}

import { UpdateAutomationDto } from 'src/circle/dto/automation.dto';

export class UpdateAutomationCommand {
  constructor(
    public readonly circleId: string,
    public readonly automationId: string,
    public readonly updateAutomationDto: UpdateAutomationDto,
  ) {}
}

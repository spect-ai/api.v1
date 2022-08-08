import { UpdateAutomationDto } from 'src/automation/dto/automation.dto';

export class UpdateAutomationCommand {
  constructor(
    public readonly id: string,
    public readonly automationId: string,
    public readonly updateAutomationDto: UpdateAutomationDto,
  ) {}
}

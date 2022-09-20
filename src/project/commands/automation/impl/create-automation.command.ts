import { CreateAutomationDto } from 'src/automation/dto/automation.dto';

export class CreateAutomationCommand {
  constructor(
    public readonly id: string,
    public readonly createAutomationDto: CreateAutomationDto,
  ) {}
}

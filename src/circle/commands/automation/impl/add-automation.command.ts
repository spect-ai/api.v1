import { CreateAutomationDto } from 'src/circle/dto/automation.dto';

export class AddAutomationCommand {
  constructor(
    public readonly circleId: string,
    public readonly createAutomationDto: CreateAutomationDto,
  ) {}
}

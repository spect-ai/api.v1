import { UseTemplateDto } from 'src/collection/dto/grant-workflow-template.dto';

export class OnboardingWorkflowCommand {
  constructor(
    public readonly templateDto: UseTemplateDto,
    public readonly id: string,
    public readonly caller: string,
  ) {}
}

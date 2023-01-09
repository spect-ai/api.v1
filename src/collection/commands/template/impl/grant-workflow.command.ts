import { UseTemplateDto } from 'src/collection/dto/grant-workflow-template.dto';

export class CreateGrantWorkflowCommand {
  constructor(
    public readonly templateDto: UseTemplateDto,
    public readonly id: string,
    public readonly caller: string,
  ) {}
}

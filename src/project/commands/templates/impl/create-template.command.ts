import { CreateCardTemplateDto } from 'src/project/dto/update-project-request.dto';

export class CreateCardTemplateCommand {
  constructor(
    public readonly id: string,
    public readonly createCardTemplateDto: CreateCardTemplateDto,
  ) {}
}

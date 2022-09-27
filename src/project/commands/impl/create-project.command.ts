import { CreateProjectRequestDto } from 'src/project/dto/create-project-request.dto';

export class CreateProjectCommand {
  constructor(
    public readonly createProjectDto: CreateProjectRequestDto,
    public readonly caller?: string,
  ) {}
}

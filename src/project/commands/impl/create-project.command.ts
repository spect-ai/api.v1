import { CreateProjectRequestDto } from 'src/project/dto/create-project-request.dto';

export class CreateProjectCommand {
  constructor(
    public readonly caller: string,
    public readonly createProjectDto: CreateProjectRequestDto,
  ) {}
}

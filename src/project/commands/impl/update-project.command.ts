import { UpdateProjectRequestDto } from 'src/project/dto/update-project-request.dto';

export class UpdateProjectByIdCommand {
  constructor(
    public readonly id: string,
    public readonly updateProjectDto: UpdateProjectRequestDto,
  ) {}
}

export class UpdateProjectCardNumByIdCommand {
  constructor(
    public readonly id: string,
    public readonly lastCardCount: number,
  ) {}
}

import { UpdateCircleRequestDto } from 'src/circle/dto/update-circle-request.dto';

export class UpdateCircleCommand {
  constructor(
    public readonly id: string,
    public readonly updateCircleDto: UpdateCircleRequestDto,
    public readonly caller: string,
  ) {}
}

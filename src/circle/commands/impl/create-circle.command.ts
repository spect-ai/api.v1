import { CreateCircleRequestDto } from 'src/circle/dto/create-circle-request.dto';

export class CreateCircleCommand {
  constructor(
    public readonly createCircleDto: CreateCircleRequestDto,
    public readonly caller: string,
  ) {}
}

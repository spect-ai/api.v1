import { UpdateRetroRequestDto } from 'src/retro/dto/update-retro-request.dto';

export class UpdateRetroCommand {
  constructor(
    public readonly id: string,
    public readonly updateRetroRequestDto: UpdateRetroRequestDto,
  ) {}
}

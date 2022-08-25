import { UpdateVoteRequestDto } from 'src/retro/dto/update-retro-request.dto';
import { Retro } from 'src/retro/models/retro.model';

export class UpdateRetroVoteCommand {
  constructor(
    public readonly caller: string,
    public readonly retro: Retro,
    public readonly updateRetroVoteRequestDto: UpdateVoteRequestDto,
  ) {}
}

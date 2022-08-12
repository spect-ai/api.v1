import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { Retro } from 'src/retro/models/retro.model';

export class RetroEndedEvent {
  constructor(
    public readonly retro: Retro | DetailedRetroResponseDto,
    public readonly caller: string,
  ) {}
}

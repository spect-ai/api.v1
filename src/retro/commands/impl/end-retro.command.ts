import { Retro } from 'src/retro/models/retro.model';

export class EndRetroCommand {
  constructor(public readonly retro: Retro) {}
}

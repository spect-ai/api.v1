import { CreateRetroRequestDto } from 'src/retro/dto/create-retro-request.dto';

export class CreateRetroCommand {
  constructor(public readonly createRetroRequestDto: CreateRetroRequestDto) {}
}

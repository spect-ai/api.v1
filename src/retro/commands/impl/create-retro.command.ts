import { Circle } from 'src/circle/model/circle.model';
import { CreateRetroRequestDto } from 'src/retro/dto/create-retro-request.dto';

export class CreateRetroCommand {
  constructor(
    public readonly createRetroRequestDto: CreateRetroRequestDto,
    public readonly circle: Circle,
    public readonly caller: string,
  ) {}
}

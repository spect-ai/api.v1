import { AddFeedbackRequestDto } from 'src/retro/dto/add-feedback-request.dto';
import { Retro } from 'src/retro/models/retro.model';

export class AddFeedbackCommand {
  constructor(
    public readonly caller: string,
    public readonly retro: Retro,
    public readonly addFeedbackRequestDto: AddFeedbackRequestDto,
  ) {}
}

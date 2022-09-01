import { RecordKudosDto } from 'src/card/dto/update-card-request.dto';
import { Card } from 'src/card/model/card.model';

export class AddKudosCommand {
  constructor(
    public readonly kudos: RecordKudosDto,
    public readonly card?: Card,
    public readonly id?: string,
  ) {}
}

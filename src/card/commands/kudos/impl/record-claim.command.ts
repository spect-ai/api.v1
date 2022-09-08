import {
  RecordClaimInfoDto,
  RecordKudosDto,
} from 'src/card/dto/update-card-request.dto';
import { Card } from 'src/card/model/card.model';

export class RecordClaimCommand {
  constructor(
    public readonly recordClaimRequestDto: RecordClaimInfoDto,
    public readonly caller: string,
    public readonly card?: Card,
    public readonly id?: string,
  ) {}
}

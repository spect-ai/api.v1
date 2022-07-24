import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { CreateWorkUnitRequestDto } from 'src/card/dto/work-request.dto';
import { Card } from 'src/card/model/card.model';

export class WorkUnitCreatedEvent {
  constructor(
    public readonly card: Card | DetailedCardResponseDto,
    public readonly createWorkUnitRequestDto: CreateWorkUnitRequestDto,
    public readonly circleSlug: string,
    public readonly projectSlug: string,
    public readonly caller: string,
  ) {}
}

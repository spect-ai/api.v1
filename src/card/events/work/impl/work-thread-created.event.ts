import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { CreateWorkThreadRequestDto } from 'src/card/dto/work-request.dto';
import { Card } from 'src/card/model/card.model';

export class WorkThreadCreatedEvent {
  constructor(
    public readonly card: Card | DetailedCardResponseDto,
    public readonly createWorkThreadRequestDto: CreateWorkThreadRequestDto,
    public readonly circleSlug: string,
    public readonly projectSlug: string,
    public readonly caller: string,
  ) {}
}

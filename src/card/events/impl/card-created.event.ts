import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { Card } from 'src/card/model/card.model';

export class CardCreatedEvent {
  constructor(
    public readonly card: Card | DetailedCardResponseDto,
    public readonly circleSlug: string,
    public readonly projectSlug: string,
    public readonly caller: string,
  ) {}
}

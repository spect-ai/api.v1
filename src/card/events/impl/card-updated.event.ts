import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { Card } from 'src/card/model/card.model';
import { Diff } from 'src/common/interfaces';

export class CardUpdatedEvent {
  constructor(
    public readonly card: Card | DetailedCardResponseDto,
    public readonly diff: Diff<Card>,
    public readonly circleSlug: string,
    public readonly projectSlug: string,
    public readonly caller: string,
  ) {}
}

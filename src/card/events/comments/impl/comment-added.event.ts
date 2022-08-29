import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { Card } from 'src/card/model/card.model';

export class CommentAddedEvent {
  constructor(
    public readonly card: Card | DetailedCardResponseDto,
    public readonly comment: string,
    public readonly caller: string,
  ) {}
}

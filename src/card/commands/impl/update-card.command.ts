import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Project } from 'src/project/model/project.model';

export class UpdateCardCommand {
  constructor(
    public readonly updateCardDto: UpdateCardRequestDto,
    public readonly project: Project,
    public readonly circle: Circle,
    public readonly caller: string,
    public readonly card: Card,
  ) {}
}

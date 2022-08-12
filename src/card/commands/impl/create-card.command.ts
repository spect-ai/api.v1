import { CreateCardRequestDto } from 'src/card/dto/create-card-request.dto';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Project } from 'src/project/model/project.model';

export class CreateCardCommand {
  constructor(
    public readonly createCardDto: CreateCardRequestDto,
    public readonly project: Project,
    public readonly circle: Circle,
    public readonly caller: string,
    public readonly parentCard?: Card,
  ) {}
}

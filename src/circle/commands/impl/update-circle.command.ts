import {
  UpdateCircleRequestDto,
  WhitelistAddressRequestDto,
} from 'src/circle/dto/update-circle-request.dto';
import { Circle } from 'src/circle/model/circle.model';
import { MappedItem } from 'src/common/interfaces';

export class UpdateCircleCommand {
  constructor(
    public readonly id: string,
    public readonly updateCircleDto:
      | UpdateCircleRequestDto
      | WhitelistAddressRequestDto,
    public readonly caller: string,
  ) {}
}

export class UpdateMultipleCirclesCommand {
  constructor(public readonly updates: MappedItem<Partial<Circle>>) {}
}

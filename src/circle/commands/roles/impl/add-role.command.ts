import { AddRoleDto } from 'src/circle/dto/roles-requests.dto';
import { Circle } from 'src/circle/model/circle.model';

export class AddRoleCommand {
  constructor(
    public readonly roleDto: AddRoleDto,
    public readonly circle?: Circle,
    public readonly id?: string,
  ) {}
}

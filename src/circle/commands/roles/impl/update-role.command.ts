import { UpdateRoleDto } from 'src/circle/dto/roles-requests.dto';
import { Circle } from 'src/circle/model/circle.model';

export class UpdateRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly roleDto: UpdateRoleDto,
    public readonly circle?: Circle,
    public readonly id?: string,
  ) {}
}
